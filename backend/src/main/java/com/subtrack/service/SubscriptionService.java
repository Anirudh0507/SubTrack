
package com.subtrack.service;

import com.subtrack.entity.Subscription;
import com.subtrack.entity.User;
import com.subtrack.repository.SubscriptionRepository;
import com.subtrack.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public SubscriptionService(
            SubscriptionRepository subscriptionRepository,
            UserRepository userRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Subscription> getSubscriptions(String email) {
        User user = getUserByEmail(email);

        return subscriptionRepository
                .findAllByUserIdOrderByNextRenewalDateAsc(user.getId());
    }

    @Transactional
    public Subscription createSubscription(
            String email, Subscription subscription) {

        User user = getUserByEmail(email);
        validateSubscription(subscription);

        subscription.setId(null);
        subscription.setUser(user);
        subscription.setCreatedAt(null);

        return subscriptionRepository.save(subscription);
    }

    @Transactional
    public Subscription updateSubscription(
            String email, Long subscriptionId,
            Subscription updatedSubscription) {

        User user = getUserByEmail(email);

        Subscription existing = subscriptionRepository
                .findByIdAndUserId(subscriptionId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Subscription not found"));

        validateSubscription(updatedSubscription);

        existing.setName(updatedSubscription.getName().trim());
        existing.setCategory(updatedSubscription.getCategory());
        existing.setAmount(updatedSubscription.getAmount());
        existing.setBillingCycle(updatedSubscription.getBillingCycle());
        existing.setNextRenewalDate(updatedSubscription.getNextRenewalDate());
        existing.setNotes(updatedSubscription.getNotes());
        existing.setActive(updatedSubscription.isActive());

        return subscriptionRepository.save(existing);
    }

    @Transactional
    public void deleteSubscription(String email, Long subscriptionId) {
        User user = getUserByEmail(email);

        Subscription subscription = subscriptionRepository
                .findByIdAndUserId(subscriptionId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Subscription not found"));

        subscriptionRepository.delete(subscription);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User account not found"));
    }

    private void validateSubscription(Subscription subscription) {
        if (subscription.getName() == null
                || subscription.getName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Subscription name is required");
        }

        subscription.setName(subscription.getName().trim());

        if (subscription.getAmount() == null
                || subscription.getAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Amount cannot be negative");
        }

        if (subscription.getBillingCycle() == null
                || !List.of("MONTHLY", "YEARLY", "WEEKLY")
                        .contains(subscription.getBillingCycle().toUpperCase())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Billing cycle must be MONTHLY, YEARLY, or WEEKLY");
        }

        subscription.setBillingCycle(
                subscription.getBillingCycle().toUpperCase());

        if (subscription.getNextRenewalDate() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Next renewal date is required");
        }
    }
}
