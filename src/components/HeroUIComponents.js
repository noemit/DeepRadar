"use client";
import React, { useState } from "react";
import {
  // Basic Icons
  HomeIcon,
  UserIcon,
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon,

  // Action Icons
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,

  // Navigation Icons
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowRightIcon,

  // Status Icons
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,

  // Communication Icons
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,

  // Media Icons
  PlayIcon,
  PauseIcon,
  StopIcon,

  // File Icons
  DocumentIcon,
  FolderIcon,
  PhotoIcon,
  VideoCameraIcon,

  // Social Icons
  HeartIcon,
  ShareIcon,
  BookmarkIcon,
  StarIcon,

  // Additional Icons for Enhanced Components
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

// Button Component with HeroUI styling
function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  disabled = false,
  onClick,
  className = "",
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-sm";

  const variants = {
    primary: "btn-gradient border-0",
    secondary: "btn-secondary-dark",
    success:
      "border border-transparent text-black bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 focus:ring-emerald-500 shadow-lg shadow-emerald-500/30",
    danger:
      "border border-transparent text-stone-200 bg-gradient-to-r from-red-600 to-red-500 hover:opacity-90 focus:ring-red-500 shadow-lg shadow-red-500/30",
    warning:
      "border border-transparent text-stone-200 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:opacity-90 focus:ring-yellow-500 shadow-lg shadow-yellow-500/30",
    info: "border border-transparent text-stone-200 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:opacity-90 focus:ring-cyan-500 shadow-lg shadow-cyan-500/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
    xl: "px-6 py-3 text-lg",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && iconPosition === "left" && (
        <Icon className={`w-4 h-4 ${size === "sm" ? "mr-1" : "mr-2"}`} />
      )}
      {children}
      {Icon && iconPosition === "right" && (
        <Icon className={`w-4 h-4 ${size === "sm" ? "ml-1" : "ml-2"}`} />
      )}
    </button>
  );
}

// Card Component
function Card({ children, className = "", ...props }) {
  return (
    <div className={`card-sleek ${className}`} {...props}>
      {children}
    </div>
  );
}

// Input Component
function Input({ label, error, icon: Icon, className = "", ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-stone-200 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-stone-200" />
          </div>
        )}
        <input
          className={`
            w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-stone-200
            focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue/50 
            transition-all duration-200 placeholder-gray-400
            ${Icon ? "pl-10" : ""}
            ${
              error
                ? "border-red-500/50 focus:ring-red-500/50 bg-red-900/20"
                : ""
            }
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-200 flex items-center">
          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}

// Badge Component
function Badge({ children, variant = "default", size = "md", className = "" }) {
  const baseClasses = "inline-flex items-center font-medium rounded-full";

  const variants = {
    default: "bg-gray-700/50 text-stone-200 border border-gray-600/50",
    primary: "bg-accent-blue/20 text-accent-blue border border-accent-blue/30",
    success: "bg-emerald-500/20 text-stone-200 border border-emerald-500/30",
    warning: "bg-yellow-500/20 text-stone-200 border border-yellow-500/30",
    danger: "bg-red-500/20 text-stone-200 border border-red-500/30",
    info: "bg-cyan-500/20 text-stone-200 border border-cyan-500/30",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return <span className={classes}>{children}</span>;
}

// Alert Component
function Alert({ children, variant = "info", icon: Icon, className = "" }) {
  const baseClasses = "p-4 rounded-lg border flex items-start";

  const variants = {
    info: "bg-cyan-900/20 border-cyan-500/30 text-cyan-100",
    success: "bg-emerald-900/20 border-emerald-500/30 text-emerald-100",
    warning: "bg-yellow-900/20 border-yellow-500/30 text-yellow-100",
    danger: "bg-red-900/20 border-red-500/30 text-red-100",
  };

  const defaultIcons = {
    info: InformationCircleIcon,
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    danger: XCircleIcon,
  };

  const IconComponent = Icon || defaultIcons[variant];

  const classes = `${baseClasses} ${variants[variant]} ${className}`;

  return (
    <div className={classes}>
      {IconComponent && (
        <IconComponent className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}

// Enhanced Card Component with micro-animations
function EnhancedCard({
  children,
  className = "",
  hoverable = false,
  expandable = false,
  isExpanded = false,
  onToggle,
  ...props
}) {
  const baseClasses = "card-sleek transition-all duration-300 ease-in-out";
  const hoverClasses = hoverable ? "card-hover cursor-pointer" : "";
  const expandClasses = expandable ? "overflow-hidden" : "";

  const classes = `${baseClasses} ${hoverClasses} ${expandClasses} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

// Nested Card Component
function NestedCard({
  title,
  children,
  level = 1,
  className = "",
  collapsible = false,
  isCollapsed = false,
  onToggle,
  ...props
}) {
  const levelColors = [
    "border-l-4 border-l-blue-500 bg-blue-50",
    "border-l-4 border-l-green-500 bg-green-50",
    "border-l-4 border-l-purple-500 bg-purple-50",
    "border-l-4 border-l-orange-500 bg-orange-50",
  ];

  const levelColor = levelColors[Math.min(level - 1, levelColors.length - 1)];
  const baseClasses = `rounded-lg border border-gray-200 p-4 transition-all duration-200 ${levelColor}`;
  const hoverClasses = "hover:shadow-md hover:scale-[1.01]";

  const classes = `${baseClasses} ${hoverClasses} ${className}`;

  return (
    <div className={classes} {...props}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h3
            className={`font-semibold text-gray-800 text-${
              level === 1 ? "lg" : "base"
            }`}
          >
            {title}
          </h3>
          {collapsible && (
            <button
              onClick={onToggle}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                  isCollapsed ? "rotate-0" : "rotate-180"
                }`}
              />
            </button>
          )}
        </div>
      )}
      <div
        className={`transition-all duration-300 ease-in-out ${
          collapsible && isCollapsed
            ? "max-h-0 opacity-0 overflow-hidden"
            : "max-h-96 opacity-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// Panel Component with tabs
function Panel({
  title,
  children,
  tabs = [],
  activeTab = "overview",
  onTabChange,
  className = "",
  ...props
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}
      {...props}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
      )}

      {tabs.length > 0 && (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="p-6">{children}</div>
    </div>
  );
}

// Accordion Component
function Accordion({
  items = [],
  className = "",
  allowMultiple = false,
  ...props
}) {
  const [openItems, setOpenItems] = useState(allowMultiple ? [] : null);

  const toggleItem = (itemId) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(itemId)
          ? prev.filter((id) => id !== itemId)
          : [...prev, itemId]
      );
    } else {
      setOpenItems(openItems === itemId ? null : itemId);
    }
  };

  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {items.map((item) => {
        const isOpen = allowMultiple
          ? openItems.includes(item.id)
          : openItems === item.id;

        return (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
            >
              <span className="font-medium text-gray-900">{item.title}</span>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-4 py-3 bg-white border-t border-gray-200">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Progress Card Component
function ProgressCard({
  title,
  progress,
  total,
  variant = "default",
  showPercentage = true,
  className = "",
  ...props
}) {
  const percentage = Math.round((progress / total) * 100);

  const variants = {
    default: "bg-blue-500",
    success: "bg-green-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  const progressColor = variants[variant];

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}
      {...props}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {showPercentage && (
          <span className="text-2xl font-bold text-gray-700">
            {percentage}%
          </span>
        )}
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>
            {progress} / {total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Stats Grid Component
function StatsGrid({ stats = [], className = "", ...props }) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
      {...props}
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  stat.color || "bg-blue-500"
                }`}
              >
                {stat.icon && <stat.icon className="w-5 h-5 text-stone-200" />}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.change && (
                <div
                  className={`mt-2 text-sm ${
                    stat.change > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change > 0 ? "↗" : "↘"} {Math.abs(stat.change)}%
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Icon Showcase Component
function IconShowcase() {
  const iconCategories = [
    {
      title: "Basic Icons",
      icons: [
        { name: "Home", icon: HomeIcon },
        { name: "User", icon: UserIcon },
        { name: "Settings", icon: CogIcon },
        { name: "Bell", icon: BellIcon },
        { name: "Search", icon: MagnifyingGlassIcon },
      ],
    },
    {
      title: "Action Icons",
      icons: [
        { name: "Add", icon: PlusIcon },
        { name: "Edit", icon: PencilIcon },
        { name: "Delete", icon: TrashIcon },
        { name: "View", icon: EyeIcon },
        { name: "Hide", icon: EyeSlashIcon },
      ],
    },
    {
      title: "Status Icons",
      icons: [
        { name: "Success", icon: CheckCircleIcon },
        { name: "Warning", icon: ExclamationTriangleIcon },
        { name: "Error", icon: XCircleIcon },
        { name: "Info", icon: InformationCircleIcon },
      ],
    },
    {
      title: "Navigation Icons",
      icons: [
        { name: "Left", icon: ChevronLeftIcon },
        { name: "Right", icon: ChevronRightIcon },
        { name: "Up", icon: ChevronUpIcon },
        { name: "Down", icon: ChevronDownIcon },
        { name: "Forward", icon: ArrowRightIcon },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {iconCategories.map((category) => (
        <div key={category.title}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {category.title}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {category.icons.map(({ name, icon: Icon }) => (
              <div
                key={name}
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <Icon className="w-8 h-8 text-gray-600 mb-2" />
                <span className="text-xs text-gray-600 text-center">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Usage Examples
function ComponentExamples() {
  const [inputValue, setInputValue] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-8">
      {/* Enhanced Cards Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Enhanced Cards with Micro-animations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EnhancedCard hoverable className="group">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <StarIcon className="w-6 h-6 text-stone-200" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Hoverable Card</h4>
                <p className="text-gray-600">Hover to see micro-animations</p>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard
            expandable
            isExpanded={expandedCard === "card1"}
            onToggle={() =>
              setExpandedCard(expandedCard === "card1" ? null : "card1")
            }
          >
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() =>
                setExpandedCard(expandedCard === "card1" ? null : "card1")
              }
            >
              <h4 className="font-semibold text-gray-900">Expandable Card</h4>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                  expandedCard === "card1" ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>
            {expandedCard === "card1" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-600">
                  This content smoothly expands and collapses with beautiful
                  animations.
                </p>
              </div>
            )}
          </EnhancedCard>
        </div>
      </div>

      {/* Nested Cards Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Nested Cards with Level-based Styling
        </h3>
        <div className="space-y-4">
          <NestedCard
            title="Level 1 - Main Category"
            level={1}
            collapsible
            isCollapsed={expandedCard === "nested1"}
            onToggle={() =>
              setExpandedCard(expandedCard === "nested1" ? null : "nested1")
            }
          >
            <p className="text-gray-600 mb-4">
              This is the main category with blue accent.
            </p>
            <NestedCard
              title="Level 2 - Subcategory"
              level={2}
              collapsible
              isCollapsed={expandedCard === "nested2"}
              onToggle={() =>
                setExpandedCard(expandedCard === "nested2" ? null : "nested2")
              }
            >
              <p className="text-gray-600 mb-4">
                This is a subcategory with green accent.
              </p>
              <NestedCard title="Level 3 - Detail" level={3}>
                <p className="text-gray-600">
                  This is the detail level with purple accent.
                </p>
              </NestedCard>
            </NestedCard>
          </NestedCard>
        </div>
      </div>

      {/* Panel with Tabs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Panel Component with Tabs
        </h3>
        <Panel
          title="Project Dashboard"
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "analytics", label: "Analytics" },
            { id: "settings", label: "Settings" },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {activeTab === "overview" && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">
                Project Overview
              </h4>
              <p className="text-gray-600">
                Welcome to your project dashboard. Here you can see all the
                important metrics and information.
              </p>
            </div>
          )}
          {activeTab === "analytics" && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Analytics</h4>
              <p className="text-gray-600">
                View detailed analytics and performance metrics for your
                project.
              </p>
            </div>
          )}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Settings</h4>
              <p className="text-gray-600">
                Configure your project settings and preferences.
              </p>
            </div>
          )}
        </Panel>
      </div>

      {/* Accordion Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Accordion Component
        </h3>
        <Accordion
          items={[
            {
              id: "faq1",
              title: "How do I use these components?",
              content:
                "Simply import them from HeroUIComponents and use them in your JSX with the appropriate props.",
            },
            {
              id: "faq2",
              title: "Are the animations customizable?",
              content:
                "Yes! All components use Tailwind CSS classes that you can easily customize or override.",
            },
            {
              id: "faq3",
              title: "What about accessibility?",
              content:
                "All components are built with accessibility in mind, including proper ARIA labels and keyboard navigation.",
            },
          ]}
        />
      </div>

      {/* Progress Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Progress Cards with Smooth Animations
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Stats Grid with Hover Effects
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

      {/* Basic Components (Original) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Components
        </h3>

        {/* Buttons */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Button Variants
          </h4>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" icon={PlusIcon}>
              Primary
            </Button>
            <Button variant="secondary" icon={PencilIcon}>
              Secondary
            </Button>
            <Button variant="success" icon={CheckCircleIcon}>
              Success
            </Button>
            <Button variant="danger" icon={TrashIcon}>
              Danger
            </Button>
            <Button variant="warning" icon={ExclamationTriangleIcon}>
              Warning
            </Button>
            <Button variant="info" icon={InformationCircleIcon}>
              Info
            </Button>
          </div>
        </div>

        {/* Button Sizes */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Button Sizes
          </h4>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="primary">
              Small
            </Button>
            <Button size="md" variant="primary">
              Medium
            </Button>
            <Button size="lg" variant="primary">
              Large
            </Button>
            <Button size="xl" variant="primary">
              Extra Large
            </Button>
          </div>
        </div>

        {/* Inputs */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Input Variants
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Basic Input"
              placeholder="Enter text here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="Input with Icon"
              icon={UserIcon}
              placeholder="Enter username..."
            />
            <Input
              label="Input with Error"
              icon={EnvelopeIcon}
              placeholder="Enter email..."
              error="Please enter a valid email address"
            />
            <Input
              label="Disabled Input"
              placeholder="This input is disabled"
              disabled
            />
          </div>
        </div>

        {/* Badges */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Badge Variants
          </h4>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </div>

        {/* Alerts */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Alert Variants
          </h4>
          <div className="space-y-3">
            <Alert variant="info">
              This is an informational alert. It provides useful information to
              the user.
            </Alert>
            <Alert variant="success">
              This is a success alert. It indicates that an action was completed
              successfully.
            </Alert>
            <Alert variant="warning">
              This is a warning alert. It warns the user about something
              important.
            </Alert>
            <Alert variant="danger">
              This is a danger alert. It indicates an error or dangerous action.
            </Alert>
          </div>
        </div>

        {/* Interactive Example */}
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Interactive Example
          </h4>
          <div className="flex gap-3">
            <Button
              variant="primary"
              icon={BellIcon}
              onClick={() => setShowAlert(!showAlert)}
            >
              {showAlert ? "Hide Alert" : "Show Alert"}
            </Button>
            <Button
              variant="secondary"
              icon={CogIcon}
              onClick={() => alert("Settings clicked!")}
            >
              Settings
            </Button>
          </div>

          {showAlert && (
            <Alert variant="success" className="mt-4">
              <strong>Great!</strong> You clicked the button. This alert is now
              visible.
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

// Export all components
export {
  // UI Components
  Button,
  Card,
  Input,
  Badge,
  Alert,

  // Enhanced Components
  EnhancedCard,
  NestedCard,
  Panel,
  Accordion,
  ProgressCard,
  StatsGrid,

  // Showcase Components
  IconShowcase,
  ComponentExamples,

  // Icons
  HomeIcon,
  UserIcon,
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  DocumentIcon,
  FolderIcon,
  PhotoIcon,
  VideoCameraIcon,
  HeartIcon,
  ShareIcon,
  BookmarkIcon,
  StarIcon,
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
};
