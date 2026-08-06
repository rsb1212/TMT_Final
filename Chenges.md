# SME Dashboard - AI Module Requirement

## Overview

The SME Dashboard provides a personalized view for Subject Matter Experts (SMEs) to review and sign off test cases related only to their assigned modules. The dashboard enables efficient tracking of pending reviews, sign-offs, and overall module progress.

# Objectives

- Display module-wise test case statistics.
- Show pending review and sign-off counts.
- Restrict visibility to assigned modules only.
- Support module, channel, and department/function mappings.
- Provide AI-driven insights and recommendations.
- Enable efficient monitoring of testing progress.


# Dashboard Features

## Module-wise Test Case Summary

The dashboard should display the following information for each assigned module:

- Module Name
- Total Test Cases
- Pending Review Count
- Pending Sign-off Count
- Reviewed Test Cases
- Signed-off Test Cases
- Completion Percentage

   Sample View

   Repo Module
- Total Test Cases: 150
- Pending Review: 20
- Pending Sign-off: 10
- Completed: 120

   Product Module
- Total Test Cases: 80
- Pending Review: 5
- Pending Sign-off: 8
- Completed: 67

# SME Module Mapping

Each SME should only be able to view modules assigned to them.

## Example

   SME: Rahul
Assigned Modules:
- Repo
- Product

   SME: Amit
Assigned Modules:
- NFO
- BAU Project

   Business Rule

When an SME logs in:

- Display only assigned modules.
- Hide all non-assigned modules.
- Filter all test case data based on SME-module mapping.

# Module Structure

## 1. Repo Module

   Description

The Repo module contains:

- Product Information
- Modification Information

   Modification Types

The following modification types must be supported:

- Rate Change
- NFO (New Fund Offer)

   Structure

Repo
├── Product
└── Modification
    ├── Rate Change
    └── NFO


## 2. BAU Project Module

The BAU Project module requires channel-wise and department/function-wise mapping.

   Mapping Attributes

  # Channel

Examples:

- Branch
- Digital
- RM Channel
- Call Center
- Partner Channel

  # Department / Function

Examples:

- Operations
- Sales
- IT
- Compliance
- Product Team
- Risk Team

   Example Mapping

Channel: Digital
Department: IT
Module: BAU Project

Channel: Branch
Department: Operations
Module: BAU Project

Channel: RM Channel
Department: Sales
Module: BAU Project

# AI Capabilities

## AI Dashboard Insights

The AI engine should provide the following recommendations:

   Pending Review Alerts

Identify modules with pending reviews and highlight them on the dashboard.

   Pending Sign-off Alerts

Notify SMEs regarding pending sign-offs.

   Delay Prediction

Predict review delays based on historical review trends.

   Risk Identification

Identify modules with:

- High pending workload
- Repeated review delays
- High defect density

   Smart Prioritization

Suggest priority test cases for SME review based on:

- Criticality
- Business impact
- Release timelines
- Historical defects

# Workflow

1. Module Creation
2. Channel/Department Mapping
3. SME Assignment
4. Test Case Creation
5. Review Submission
6. SME Review
7. SME Sign-off
8. Dashboard Update
9. Release Approval


# Dashboard Metrics

The dashboard should display:

## SME Information

- SME Name
- Assigned Modules

## Module Statistics

For each module:

- Total Test Cases
- Pending Review
- Pending Sign-off
- Reviewed
- Signed Off
- Completion %

## Overall Summary

- Total Assigned Modules
- Total Test Cases
- Total Pending Reviews
- Total Pending Sign-offs
- Overall Completion Percentage

# Sample Dashboard

## Logged-in User

SME: Rahul

Assigned Modules:
- Repo
- Product

   Repo Module

- Total Test Cases: 150
- Pending Review: 20
- Pending Sign-off: 10
- Completed: 120

   Product Module

- Total Test Cases: 80
- Pending Review: 5
- Pending Sign-off: 8
- Completed: 67

   Overall Status

- Total Test Cases: 230
- Pending Review: 25
- Pending Sign-off: 18
- Completion: 84%


# Business Rules

## Access Control

1. An SME can view only assigned modules.
2. Unassigned modules must not be visible.

## Test Case Visibility

1. Display only module-specific test cases.
2. Apply SME-module mapping while fetching records.

## Repo Module Rules

1. Product details must be maintained.
2. Modification details must be maintained.
3. Modification must support:
   - Rate Change
   - NFO

## BAU Project Rules

1. Channel-wise mapping is mandatory.
2. Department/Function-wise mapping is mandatory.
3. Test cases should be filtered based on channel and department mappings.

## Dashboard Rules

1. Dashboard data must be updated in real time.
2. Pending review and sign-off counts should be displayed separately.
3. Completion percentage should be calculated automatically.
4. AI recommendations should be displayed based on current test case status.


# Expected Benefits

- Improved SME productivity.
- Faster review and sign-off process.
- Better visibility into testing progress.
- Reduced manual tracking.
- Early identification of delays and risks.
- Intelligent prioritization through AI insights.