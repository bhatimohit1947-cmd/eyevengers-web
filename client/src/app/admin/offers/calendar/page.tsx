"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function CalendarView() {
  const [events, setEvents] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`https://eyevengers-web.onrender.com/api/offers/calendar`)
      .then(res => res.json())
      .then(data => {
        const mappedEvents = data.map((o: any) => ({
          id: o.id,
          title: o.name,
          start: new Date(o.startDatetime),
          end: new Date(o.endDatetime),
          allDay: true,
          hasConflict: o.hasConflict,
          conflictDetails: o.conflictDetails
        }));
        setEvents(mappedEvents);
      });
  }, []);

  const eventStyleGetter = (event: any) => {
    const isConflict = event.hasConflict;
    const style = {
      backgroundColor: isConflict ? '#fee2e2' : '#eff6ff',
      border: `2px solid ${isConflict ? '#ef4444' : '#3b82f6'}`,
      color: isConflict ? '#b91c1c' : '#1e40af',
      fontWeight: 'bold' as any,
      borderRadius: '6px',
      padding: '2px 4px',
    };
    return { style };
  };

  const CustomEvent = ({ event }: any) => {
    const formattedEnd = format(event.end, 'dd MMM');
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          {event.hasConflict && <AlertCircle size={12} className="text-red-500 shrink-0" />}
          <span className="truncate">{event.title} <span className="opacity-75 font-normal">(Ends: {formattedEnd})</span></span>
        </div>
      {event.hasConflict && (
        <span className="text-[10px] text-red-600 font-normal leading-tight">
          {event.conflictDetails}
        </span>
      )}
    </div>
  );
  };

  return (
    <div className="p-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campaign Calendar</h2>
          <p className="text-gray-500">View active dates and resolve overlap conflicts.</p>
        </div>
        <Link href="/admin/offers" className="flex items-center gap-2 text-brand-navy font-bold hover:underline">
          <ArrowLeft size={16} /> Back to List
        </Link>
      </div>

      <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          components={{ event: CustomEvent }}
          views={['month', 'week']}
          onSelectEvent={(event) => router.push(`/admin/offers?edit=${event.id}`)}
        />
      </div>
    </div>
  );
}
