package com.splitly.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class Dtos {

    public record RegisterRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 100) String password
    ) {}

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
    ) {}

    public record AuthResponse(String token, UserResponse user) {}

    public record UserResponse(Long id, String name, String email, String avatarUrl) {}

    public record UpdateNameRequest(@NotBlank @Size(max = 120) String name) {}
    public record UpdatePasswordRequest(@NotBlank @Size(min = 6) String password) {}

    public record CreateGroupRequest(@NotBlank @Size(max = 120) String name) {}
    public record GroupResponse(Long id, String name, Long createdBy, String createdAt) {}
    public record AddMemberRequest(@NotBlank @Email String email) {}
    public record GroupDetailResponse(GroupResponse group, List<UserResponse> members) {}

    public record CreateExpenseRequest(
        @NotNull Long groupId,
        @NotBlank @Size(max = 160) String title,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank @Size(max = 40) String category,
        String description,
        @NotNull LocalDate expenseDate,
        @NotEmpty List<Long> splitUserIds
    ) {}

    public record ExpenseResponse(
        Long id, Long groupId, Long paidBy, String title, BigDecimal amount,
        String category, String description, LocalDate expenseDate, List<Long> splitUserIds
    ) {}

    public record Settlement(Long from, Long to, BigDecimal amount) {}
    public record BalancesResponse(java.util.Map<Long, BigDecimal> net, List<Settlement> settlements) {}

    public record DashboardResponse(
        BigDecimal owe, BigDecimal owed, BigDecimal net,
        List<ExpenseResponse> recent,
        List<MonthlyTotal> monthly,
        List<CategoryTotal> byCategory,
        int groupCount, int expenseCount
    ) {}
    public record MonthlyTotal(String month, BigDecimal total) {}
    public record CategoryTotal(String category, BigDecimal total) {}

    public record CategorizeRequest(@NotBlank String title, @NotNull @DecimalMin("0.01") BigDecimal amount) {}
    public record CategorizeResponse(String category) {}

    public record InsightsRequest(@NotNull List<InsightExpense> expenses) {}
    public record InsightExpense(String title, BigDecimal amount, String category, String date) {}
    public record InsightsResponse(String topCategory, String summary, String tip) {}
}
