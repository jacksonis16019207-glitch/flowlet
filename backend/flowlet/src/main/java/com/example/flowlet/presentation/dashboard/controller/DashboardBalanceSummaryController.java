package com.example.flowlet.presentation.dashboard.controller;

import com.example.flowlet.application.service.DashboardBalanceSummaryService;
import com.example.flowlet.application.service.DashboardCategoryCashflowService;
import com.example.flowlet.application.service.DashboardMonthlyCashflowService;
import com.example.flowlet.presentation.dashboard.dto.DashboardBalanceSummaryResponse;
import com.example.flowlet.presentation.dashboard.dto.DashboardCategoryCashflowResponse;
import com.example.flowlet.presentation.dashboard.dto.DashboardMonthlyCashflowResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardBalanceSummaryController {

    private final DashboardBalanceSummaryService dashboardBalanceSummaryService;
    private final DashboardMonthlyCashflowService dashboardMonthlyCashflowService;
    private final DashboardCategoryCashflowService dashboardCategoryCashflowService;

    public DashboardBalanceSummaryController(
        DashboardBalanceSummaryService dashboardBalanceSummaryService,
        DashboardMonthlyCashflowService dashboardMonthlyCashflowService,
        DashboardCategoryCashflowService dashboardCategoryCashflowService
    ) {
        this.dashboardBalanceSummaryService = dashboardBalanceSummaryService;
        this.dashboardMonthlyCashflowService = dashboardMonthlyCashflowService;
        this.dashboardCategoryCashflowService = dashboardCategoryCashflowService;
    }

    @GetMapping("/balance-summary")
    public DashboardBalanceSummaryResponse getBalanceSummary() {
        return dashboardBalanceSummaryService.getSummary();
    }

    @GetMapping("/monthly-cashflow")
    public DashboardMonthlyCashflowResponse getMonthlyCashflow(
        @RequestParam String fromMonth,
        @RequestParam String toMonth
    ) {
        return dashboardMonthlyCashflowService.getMonthlyCashflow(fromMonth, toMonth);
    }

    @GetMapping("/category-cashflow")
    public DashboardCategoryCashflowResponse getCategoryCashflow(
        @RequestParam String fromMonth,
        @RequestParam String toMonth
    ) {
        return dashboardCategoryCashflowService.getCategoryCashflow(fromMonth, toMonth);
    }
}
