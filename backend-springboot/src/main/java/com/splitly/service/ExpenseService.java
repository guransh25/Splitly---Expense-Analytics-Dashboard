package com.splitly.service;

import com.splitly.dto.Dtos.*;
import com.splitly.entity.*;
import com.splitly.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenses;
    private final ExpenseSplitRepository splits;
    private final GroupMemberRepository members;

    @Transactional
    public Expense create(Long userId, CreateExpenseRequest req) {
        if (!members.existsByGroupIdAndUserId(req.groupId(), userId))
            throw new SecurityException("Not a member of this group");
        Expense e = Expense.builder()
            .groupId(req.groupId())
            .paidBy(userId)
            .title(req.title())
            .amount(req.amount())
            .category(req.category())
            .description(req.description())
            .expenseDate(req.expenseDate())
            .build();
        e = expenses.save(e);
        BigDecimal share = req.amount().divide(BigDecimal.valueOf(req.splitUserIds().size()), 2, RoundingMode.HALF_UP);
        for (Long uid : req.splitUserIds()) {
            splits.save(ExpenseSplit.builder().expenseId(e.getId()).userId(uid).shareAmount(share).build());
        }
        return e;
    }

    @Transactional
    public void delete(Long userId, Long expenseId) {
        Expense e = expenses.findById(expenseId).orElseThrow();
        if (!e.getPaidBy().equals(userId)) throw new SecurityException("Only the payer can delete this");
        expenses.delete(e);
    }

    public List<ExpenseResponse> listForGroup(Long userId, Long groupId) {
        if (!members.existsByGroupIdAndUserId(groupId, userId))
            throw new SecurityException("Not a member of this group");
        List<Expense> list = expenses.findByGroupIdOrderByExpenseDateDesc(groupId);
        Map<Long, List<Long>> splitMap = loadSplitMap(list);
        return list.stream().map(e -> toDto(e, splitMap)).toList();
    }

    public BalancesResponse balances(Long userId, Long groupId) {
        if (!members.existsByGroupIdAndUserId(groupId, userId))
            throw new SecurityException("Not a member of this group");
        List<Expense> list = expenses.findByGroupIdOrderByExpenseDateDesc(groupId);
        Map<Long, List<Long>> splitMap = loadSplitMap(list);
        var net = BalanceUtil.net(list, splitMap);
        return new BalancesResponse(net, BalanceUtil.settlements(net));
    }

    public DashboardResponse dashboard(Long userId) {
        // groups the user belongs to
        List<Long> groupIds = members.findAll().stream()
            .filter(m -> m.getUserId().equals(userId))
            .map(GroupMember::getGroupId).toList();

        List<Expense> all = groupIds.isEmpty() ? List.of() : expenses.findByGroupIdIn(groupIds);
        Map<Long, List<ExpenseSplit>> splitsByExpense = loadSplits(all);

        BigDecimal owe = BigDecimal.ZERO, owed = BigDecimal.ZERO;
        for (Expense e : all) {
            List<ExpenseSplit> ss = splitsByExpense.getOrDefault(e.getId(), List.of());
            if (e.getPaidBy().equals(userId)) {
                BigDecimal others = ss.stream()
                    .filter(s -> !s.getUserId().equals(userId))
                    .map(ExpenseSplit::getShareAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                owed = owed.add(others);
            } else {
                ss.stream().filter(s -> s.getUserId().equals(userId)).findFirst()
                    .ifPresent(s -> {});
                BigDecimal mine = ss.stream().filter(s -> s.getUserId().equals(userId))
                    .map(ExpenseSplit::getShareAmount).findFirst().orElse(BigDecimal.ZERO);
                owe = owe.add(mine);
            }
        }

        // monthly totals (last 6 months)
        Map<String, BigDecimal> monthly = new LinkedHashMap<>();
        YearMonth now = YearMonth.now();
        for (int i = 5; i >= 0; i--) monthly.put(now.minusMonths(i).toString(), BigDecimal.ZERO);
        Map<String, BigDecimal> byCat = new HashMap<>();
        for (Expense e : all) {
            String m = YearMonth.from(e.getExpenseDate()).toString();
            monthly.computeIfPresent(m, (k, v) -> v.add(e.getAmount()));
            byCat.merge(e.getCategory(), e.getAmount(), BigDecimal::add);
        }
        List<MonthlyTotal> monthlyList = monthly.entrySet().stream()
            .map(en -> new MonthlyTotal(en.getKey(), en.getValue().setScale(2, RoundingMode.HALF_UP))).toList();
        List<CategoryTotal> catList = byCat.entrySet().stream()
            .map(en -> new CategoryTotal(en.getKey(), en.getValue().setScale(2, RoundingMode.HALF_UP))).toList();

        Map<Long, List<Long>> splitMap = loadSplitMap(all);
        List<ExpenseResponse> recent = all.stream()
            .sorted(Comparator.comparing(Expense::getExpenseDate).reversed())
            .limit(5).map(e -> toDto(e, splitMap)).toList();

        return new DashboardResponse(
            owe.setScale(2, RoundingMode.HALF_UP),
            owed.setScale(2, RoundingMode.HALF_UP),
            owed.subtract(owe).setScale(2, RoundingMode.HALF_UP),
            recent, monthlyList, catList,
            groupIds.size(), all.size()
        );
    }

    private Map<Long, List<ExpenseSplit>> loadSplits(List<Expense> list) {
        if (list.isEmpty()) return Map.of();
        return splits.findByExpenseIdIn(list.stream().map(Expense::getId).toList())
                     .stream().collect(Collectors.groupingBy(ExpenseSplit::getExpenseId));
    }

    private Map<Long, List<Long>> loadSplitMap(List<Expense> list) {
        return loadSplits(list).entrySet().stream()
            .collect(Collectors.toMap(Map.Entry::getKey,
                e -> e.getValue().stream().map(ExpenseSplit::getUserId).toList()));
    }

    private ExpenseResponse toDto(Expense e, Map<Long, List<Long>> splitMap) {
        return new ExpenseResponse(e.getId(), e.getGroupId(), e.getPaidBy(), e.getTitle(),
            e.getAmount(), e.getCategory(), e.getDescription(), e.getExpenseDate(),
            splitMap.getOrDefault(e.getId(), List.of()));
    }
}
