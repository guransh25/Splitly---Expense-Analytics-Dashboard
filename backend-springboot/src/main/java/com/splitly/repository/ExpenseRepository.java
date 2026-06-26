package com.splitly.repository;

import com.splitly.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByGroupIdOrderByExpenseDateDesc(Long groupId);
    List<Expense> findByGroupIdIn(List<Long> groupIds);
}
