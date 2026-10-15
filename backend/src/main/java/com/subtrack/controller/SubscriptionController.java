
package com.subtrack.controller;

import com.subtrack.entity.Subscription;
import com.subtrack.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public ResponseEntity<List<Subscription>> getSubscriptions(
            Authentication authentication) {

        return ResponseEntity.ok(
                subscriptionService.getSubscriptions(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<Subscription> createSubscription(
            Authentication authentication,
            @Valid @RequestBody Subscription subscription) {

        Subscription created = subscriptionService.createSubscription(
                authentication.getName(), subscription);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Subscription> updateSubscription(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody Subscription subscription) {

        return ResponseEntity.ok(
                subscriptionService.updateSubscription(
                        authentication.getName(), id, subscription));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubscription(
            Authentication authentication,
            @PathVariable Long id) {

        subscriptionService.deleteSubscription(
                authentication.getName(), id);

        return ResponseEntity.noContent().build();
    }
}
