"use client";
import React from "react";
import {
  IconShowcase,
  ComponentExamples,
  Button,
  Card,
  Input,
  Badge,
  Alert,
  EnhancedCard,
  NestedCard,
  Panel,
  Accordion,
  ProgressCard,
  StatsGrid,
} from "../../components/HeroUIComponents";
import {
  ArrowLeftIcon,
  HomeIcon,
  CogIcon,
  SwatchIcon,
  StarIcon,
  CheckCircleIcon,
  UserIcon,
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

export default function ComponentsPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-accent rounded-full mb-4 shadow-lg shadow-purple-500/30">
            <SwatchIcon className="w-8 h-8 text-stone-200" />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-3">
            HeroUI Component Library
          </h1>
          <p className="text-xl text-stone-200 mb-1">
            A comprehensive collection of reusable UI components
          </p>
          <p className="text-sm text-stone-200">
            Built with Headless UI and Heroicons for maximum flexibility
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <a
            href="/"
            className="text-green-300 hover:text-green-400 inline-flex items-center transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Home
          </a>
          <a
            href="/"
            className="btn-gradient inline-flex items-center px-4 py-2 text-sm"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Home
          </a>
        </div>

        {/* Enhanced Components Showcase */}
        <Card className="mb-8">
          <div className="flex items-center mb-4">
            <CogIcon className="w-5 h-5 text-accent-blue mr-2" />
            <h2 className="text-xl font-semibold text-stone-200">
              Enhanced Components with Micro-animations
            </h2>
          </div>
          <ComponentExamples />
        </Card>

        {/* Enhanced Components Individual Showcase */}
        <Card className="mb-8">
          <div className="flex items-center mb-4">
            <CogIcon className="w-5 h-5 text-accent-emerald mr-2" />
            <h2 className="text-xl font-semibold text-stone-200">
              Individual Enhanced Components
            </h2>
          </div>

          <div className="space-y-6">
            {/* Enhanced Cards */}
            <div>
              <h3 className="text-base font-semibold text-stone-200 mb-3">
                Enhanced Cards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EnhancedCard hoverable className="group">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <StarIcon className="w-6 h-6 text-stone-200" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-200">
                        Hoverable Card
                      </h4>
                      <p className="text-stone-200 text-sm">
                        Hover to see micro-animations
                      </p>
                    </div>
                  </div>
                </EnhancedCard>

                <EnhancedCard>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <CheckCircleIcon className="w-6 h-6 text-stone-200" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-200">
                        Standard Card
                      </h4>
                      <p className="text-stone-200">Clean and simple design</p>
                    </div>
                  </div>
                </EnhancedCard>
              </div>
            </div>

            {/* Nested Cards */}
            <div>
              <h3 className="text-lg font-semibold text-stone-200 mb-4">
                Nested Cards
              </h3>
              <div className="space-y-4">
                <NestedCard title="Level 1 - Main Category" level={1}>
                  <p className="text-stone-200 mb-4">
                    This is the main category with blue accent.
                  </p>
                  <NestedCard title="Level 2 - Subcategory" level={2}>
                    <p className="text-stone-200 mb-4">
                      This is a subcategory with green accent.
                    </p>
                    <NestedCard title="Level 3 - Detail" level={3}>
                      <p className="text-stone-200">
                        This is the detail level with purple accent.
                      </p>
                    </NestedCard>
                  </NestedCard>
                </NestedCard>
              </div>
            </div>

            {/* Progress Cards */}
            <div>
              <h3 className="text-lg font-semibold text-stone-200 mb-4">
                Progress Cards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ProgressCard
                  title="Task Completion"
                  progress={7}
                  total={10}
                  variant="success"
                />
                <ProgressCard
                  title="Project Milestone"
                  progress={3}
                  total={5}
                  variant="warning"
                />
                <ProgressCard
                  title="Learning Progress"
                  progress={12}
                  total={20}
                  variant="default"
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div>
              <h3 className="text-lg font-semibold text-stone-200 mb-4">
                Stats Grid
              </h3>
              <StatsGrid
                stats={[
                  {
                    label: "Total Users",
                    value: "2,847",
                    icon: UserIcon,
                    color: "bg-blue-500",
                    change: 12,
                  },
                  {
                    label: "Revenue",
                    value: "$45,231",
                    icon: StarIcon,
                    color: "bg-green-500",
                    change: 8,
                  },
                  {
                    label: "Orders",
                    value: "1,234",
                    icon: ShoppingBagIcon,
                    color: "bg-purple-500",
                    change: -3,
                  },
                  {
                    label: "Growth",
                    value: "+23.5%",
                    icon: ArrowTrendingUpIcon,
                    color: "bg-orange-500",
                    change: 23,
                  },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Icon Showcase */}
        <Card className="mb-8">
          <div className="flex items-center mb-6">
            <SwatchIcon className="w-6 h-6 text-purple-600 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Available Icons
            </h2>
          </div>
          <IconShowcase />
        </Card>

        {/* Usage Instructions */}
        <Card>
          <div className="flex items-center mb-6">
            <CogIcon className="w-6 h-6 text-green-600 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">How to Use</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                1. Import Components
              </h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <code>
                  {`import { Button, Card, Input, Badge, Alert } from '../components/HeroUIComponents';
import { PlusIcon, UserIcon } from '@heroicons/react/24/outline';`}
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                2. Use in Your JSX
              </h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <code>
                  {`// Button with icon
<Button variant="primary" icon={PlusIcon}>Add New</Button>

// Card with content
<Card>
  <h2>Welcome</h2>
  <p>This is a card component</p>
</Card>

// Input with icon
<Input label="Email" icon={UserIcon} placeholder="Enter email" />

// Status badge
<Badge variant="success">Active</Badge>

// Alert message
<Alert variant="info">This is an informational message</Alert>`}
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                3. Available Variants
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Button Variants
                  </h4>
                  <div className="space-y-2">
                    <Badge variant="primary">primary</Badge>
                    <Badge variant="secondary">secondary</Badge>
                    <Badge variant="success">success</Badge>
                    <Badge variant="danger">danger</Badge>
                    <Badge variant="warning">warning</Badge>
                    <Badge variant="info">info</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Button Sizes
                  </h4>
                  <div className="space-y-2">
                    <Badge variant="default">sm</Badge>
                    <Badge variant="default">md</Badge>
                    <Badge variant="default">lg</Badge>
                    <Badge variant="default">xl</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                4. Customization
              </h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <code>
                  {`// Custom styling
<Button 
  variant="primary" 
  size="lg" 
  icon={PlusIcon}
  iconPosition="right"
  className="w-full md:w-auto"
>
  Custom Button
</Button>

// Custom input with error
<Input
  label="Username"
  error="Username is required"
  icon={UserIcon}
  className="max-w-md"
/>`}
                </code>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
