"use client";

import { RiSparklingFill } from "react-icons/ri";
import { LuTableProperties, LuTable } from "react-icons/lu";
import { FaArrowUpLong } from "react-icons/fa6";

export function QuickActions() {
  const actions = [
    {
      title: "Start with Omni",
      description: "Use AI to build a custom app tailored to your workflow",
      icon: (
        <RiSparklingFill className="h-5 w-5" />
      ),
      color: "text-purple-600",
    },
    {
      title: 'Start with templates',
      description: 'Select a template to get started and customize as you go.',
      icon: (
        <LuTableProperties className="h-5 w-5" />
      ),
      color: 'text-blue-600',
    },
    {
      title: 'Quickly upload',
      description: 'Easily migrate your existing projects in just a few minutes.',
      icon: (
        <FaArrowUpLong className="h-5 w-5" />
      ),
      color: 'text-green-600',
    },
    {
      title: 'Build an app on your own',
      description: 'Start with a blank app and build your ideal workflow.',
      icon: (
        <LuTable className="h-5 w-5" />
      ),
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-gray-300 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-2 pb-2">
            <div className={`${action.color} rounded-lg flex items-center justify-center`}>
              {action.icon}
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              {action.title}
            </h3>
          </div>
          <p className="text-gray-500 text-xs leading-relaxed">
            {action.description}
          </p>
        </div>
      ))}
    </div>
  );
}