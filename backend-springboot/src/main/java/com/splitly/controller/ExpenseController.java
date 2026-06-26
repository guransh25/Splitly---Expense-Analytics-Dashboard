package com.splitly.controller;

import com.splitly.dto.Dtos.*;
import com.splitly.entity.Expense;
import com.splitly.entity.User;
import com.splitly.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ExpenseController {
    private final ExpenseService expenses;

    @PostMapping("/expenses")
    public ExpenseResponse create(@AuthenticationPrincipal User u, @Valid @RequestBody CreateExpenseRequest req) {
        Expense e = expenses.create(u.getId(), req);
        return new ExpenseResponse(e.getId(), e.getGroupId(), e.getPaidBy(), e.getTitle(),
            e.getAmount(), e.getCategory(), e.getDescription(), e.getExpenseDate(), req.splitUserIds());
    }

    @DeleteMapping("/expenses/{id}")
    public void delete(@AuthenticationPrincipal User u, @PathVariable Long id) {
        expenses.delete(u.getId(), id);
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard(@AuthenticationPrincipal User u) {
        return expenses.dashboard(u.getId());
    }
}
