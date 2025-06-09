package com.bookstudio.dashboard.dao;

import java.util.List;
import java.util.Map;

import com.bookstudio.dashboard.model.MonthlyLoanComparison;

public interface DashboardDao {
	int getTotalActiveBooks();
	int getTotalActiveAuthors();
	int getTotalActivePublishers();
	int getTotalActiveCourses();
	int getTotalActiveStudents();
	int getTotalActiveLoans();
	Map<Integer, Integer> getLoansByMonth();
	Map<Integer, Integer> getReturnsByMonth();
	Map<Integer, Double> getAverageLoanDurationByMonth();
	List<MonthlyLoanComparison> getMonthlyLoanComparison(int year1, int year2);
}
