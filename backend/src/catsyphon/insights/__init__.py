"""Insights generation module using canonical representations."""

from catsyphon.insights.generator import InsightsGenerator
from catsyphon.insights.health_report import HealthReportGenerator
from catsyphon.insights.project_generator import ProjectInsightsGenerator

__all__ = ["InsightsGenerator", "ProjectInsightsGenerator", "HealthReportGenerator"]
