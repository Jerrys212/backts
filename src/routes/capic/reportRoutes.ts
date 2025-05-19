import express from "express";
import { protect } from "../../middlewares/capic/auth";
import {
    getSystemStats,
    getMonthlyContributionTrends,
    getUserContributionRanking,
    getLoanStats,
    getGroupPerformanceReport,
    getFinancialProjections,
    getRiskAssessmentReport,
} from "../../controllers/capic/Report.Controller";

const router = express.Router();

router.use(protect);

router.get("/system-stats", getSystemStats);

router.get("/monthly-trends", getMonthlyContributionTrends);

router.get("/user-ranking", getUserContributionRanking);

router.get("/loan-stats", getLoanStats);

router.get("/group-performance", getGroupPerformanceReport);

router.get("/financial-projections", getFinancialProjections);

router.get("/risk-assessment", getRiskAssessmentReport);

export default router;
