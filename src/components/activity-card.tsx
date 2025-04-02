'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Activity } from '@/lib/activities';

interface ActivityCardProps {
  activity: Activity;
  showActions?: boolean;
}

export function ActivityCard({ activity, showActions = true }: ActivityCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:-translate-y-1">
      <div className="relative h-48">
        {activity.image_url ? (
          <Image 
            src={activity.image_url} 
            alt={activity.title}
            className="object-cover" 
            fill
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">暂无图片</span>
          </div>
        )}
        <div className="absolute top-4 right-4 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-full">
          {activity.category[0]}
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold leading-tight">
            <Link href={`/activities/${activity.id}`} className="hover:text-blue-600 transition-colors">
              {activity.title}
            </Link>
          </h3>
        </div>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <CalendarIcon className="w-4 h-4 mr-2" />
          <span>{formatDateTime(activity.start_time)}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPinIcon className="w-4 h-4 mr-2" />
          <span>{activity.location}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <UsersIcon className="w-4 h-4 mr-2" />
          <span>
            {activity.participants_count} 人参与
            {activity.max_participants && ` / ${activity.max_participants} 人上限`}
          </span>
        </div>
      </div>
      
      {showActions && (
        <div className="p-5 pt-0">
          <Link 
            href={`/activities/${activity.id}`}
            className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md transition-colors"
          >
            了解详情
          </Link>
        </div>
      )}
    </div>
  );
} 