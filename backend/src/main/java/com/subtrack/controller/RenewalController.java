
package com.subtrack.controller;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.subtrack.entity.Subscription;
import com.subtrack.service.SubscriptionService;

@RestController
@RequestMapping("/api/renewals")
public class RenewalController {

    private final SubscriptionService subscriptionService;

    public RenewalController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public List<Map<String, Object>> getUpcomingRenewals(
            Authentication authentication,
            @RequestParam(defaultValue = "7") int days) {

        int reminderWindow = Math.max(0, Math.min(days, 90));
        LocalDate today = LocalDate.now();
        LocalDate lastDay = today.plusDays(reminderWindow);

        return subscriptionService
                .getSubscriptions(authentication.getName())
                .stream()
                .filter(Subscription::isActive)
                .filter(subscription ->
                        !subscription.getNextRenewalDate().isBefore(today)
                        && !subscription.getNextRenewalDate().isAfter(lastDay))
                .sorted(Comparator.comparing(
                        Subscription::getNextRenewalDate))
                .map(subscription -> {
                    long daysRemaining = ChronoUnit.DAYS.between(
                            today, subscription.getNextRenewalDate());

                    return Map.<String, Object>of(
                            "id", subscription.getId(),
                            "name", subscription.getName(),
                            "amount", subscription.getAmount(),
                            "billingCycle", subscription.getBillingCycle(),
                            "nextRenewalDate",
                            subscription.getNextRenewalDate(),
                            "daysRemaining", daysRemaining
                    );
                })
                .toList();
    }
}
