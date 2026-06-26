package com.splitly.controller;

import com.splitly.dto.Dtos.*;
import com.splitly.entity.Group;
import com.splitly.entity.User;
import com.splitly.service.ExpenseService;
import com.splitly.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService groups;
    private final ExpenseService expenses;

    @GetMapping
    public List<GroupResponse> list(@AuthenticationPrincipal User u) {
        return groups.listForUser(u.getId()).stream()
            .map(g -> new GroupResponse(g.getId(), g.getName(), g.getCreatedBy(), g.getCreatedAt().toString()))
            .toList();
    }

    @PostMapping
    public GroupResponse create(@AuthenticationPrincipal User u, @Valid @RequestBody CreateGroupRequest req) {
        Group g = groups.create(u.getId(), req.name());
        return new GroupResponse(g.getId(), g.getName(), g.getCreatedBy(), g.getCreatedAt().toString());
    }

    @GetMapping("/{id}")
    public GroupDetailResponse detail(@AuthenticationPrincipal User u, @PathVariable Long id) {
        return groups.detail(u.getId(), id);
    }

    @PostMapping("/{id}/members")
    public void addMember(@AuthenticationPrincipal User u, @PathVariable Long id, @Valid @RequestBody AddMemberRequest req) {
        groups.addMemberByEmail(u.getId(), id, req.email());
    }

    @GetMapping("/{id}/expenses")
    public List<ExpenseResponse> expensesFor(@AuthenticationPrincipal User u, @PathVariable Long id) {
        return expenses.listForGroup(u.getId(), id);
    }

    @GetMapping("/{id}/balances")
    public BalancesResponse balances(@AuthenticationPrincipal User u, @PathVariable Long id) {
        return expenses.balances(u.getId(), id);
    }
}
