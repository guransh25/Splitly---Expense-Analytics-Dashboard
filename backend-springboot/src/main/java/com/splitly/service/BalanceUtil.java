package com.splitly.service;

import com.splitly.dto.Dtos.Settlement;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Simple balance algorithm — equal split only.
 *
 * For each expense, the payer is credited the full amount and every
 * person in the split has their share subtracted. Net positive = is
 * owed money; net negative = owes money.
 *
 * Settlements: greedily match the largest creditor with the largest debtor
 * until everyone is at zero — minimizes the number of payments and is
 * easy for a beginner to follow.
 */
public class BalanceUtil {

    public static Map<Long, BigDecimal> net(
        List<com.splitly.entity.Expense> expenses,
        Map<Long, List<Long>> splitUsersByExpense
    ) {
        Map<Long, BigDecimal> net = new HashMap<>();
        for (var e : expenses) {
            List<Long> splitUsers = splitUsersByExpense.getOrDefault(e.getId(), List.of());
            if (splitUsers.isEmpty()) continue;
            BigDecimal share = e.getAmount().divide(BigDecimal.valueOf(splitUsers.size()), 2, RoundingMode.HALF_UP);
            net.merge(e.getPaidBy(), e.getAmount(), BigDecimal::add);
            for (Long uid : splitUsers) {
                net.merge(uid, share.negate(), BigDecimal::add);
            }
        }
        net.replaceAll((k, v) -> v.setScale(2, RoundingMode.HALF_UP));
        return net;
    }

    public static List<Settlement> settlements(Map<Long, BigDecimal> net) {
        var creditors = new ArrayList<long[]>(); // [userId, amount*100]
        var debtors = new ArrayList<long[]>();
        for (var e : net.entrySet()) {
            long cents = e.getValue().multiply(BigDecimal.valueOf(100)).longValue();
            if (cents > 0) creditors.add(new long[]{ e.getKey(), cents });
            else if (cents < 0) debtors.add(new long[]{ e.getKey(), -cents });
        }
        creditors.sort((a, b) -> Long.compare(b[1], a[1]));
        debtors.sort((a, b) -> Long.compare(b[1], a[1]));

        List<Settlement> out = new ArrayList<>();
        int i = 0, j = 0;
        while (i < creditors.size() && j < debtors.size()) {
            long pay = Math.min(creditors.get(i)[1], debtors.get(j)[1]);
            out.add(new Settlement(debtors.get(j)[0], creditors.get(i)[0],
                BigDecimal.valueOf(pay).divide(BigDecimal.valueOf(100))));
            creditors.get(i)[1] -= pay;
            debtors.get(j)[1] -= pay;
            if (creditors.get(i)[1] == 0) i++;
            if (debtors.get(j)[1] == 0) j++;
        }
        return out;
    }
}
