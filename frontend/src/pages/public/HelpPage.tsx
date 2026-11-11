import React from 'react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { HelpCircle, Shield, Clock, FileCheck, PhoneCall, AlertTriangle } from 'lucide-react';

export const HelpPage: React.FC = () => {
  const faqs = [
    {
      q: 'How does CivicResolve AI prioritize my complaint?',
      a: 'The system uses an explainable, deterministic rule engine that assigns points based on objective safety criteria—such as immediate hazard (sparks, open manholes), essential facility impact (hospitals, schools), and outage duration. Every rule fired is recorded and visible to officers.',
    },
    {
      q: 'Can an automated algorithm reject or delete my grievance?',
      a: 'Never. No model or rule is permitted to automatically reject, close, downgrade, or suppress complaints. All administrative status changes and reassessments must be performed by authorized human officers with written reasons.',
    },
    {
      q: 'What is a Service Level Agreement (SLA)?',
      a: 'An SLA is a binding departmental time target for resolving your grievance (e.g. 24 hours for live electrical hazard, 48 hours for water pipeline leaks). If a case crosses its SLA window, it is automatically flagged as overdue and escalated to supervisors.',
    },
    {
      q: 'What if I am dissatisfied with the resolution?',
      a: 'Citizens can provide feedback (1 to 5 stars) and file an appeal / reopen request with specific remarks. Reopened cases retain their entire previous audit history.',
    },
    {
      q: 'What should I do during an immediate life-threatening emergency?',
      a: 'CivicResolve AI is a municipal administrative platform. For immediate life-safety emergencies, call 112 (National Emergency), 101 (Fire), or 108 (Ambulance) directly.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">Help, FAQ & Citizen Rights</h1>
        <p className="text-sm text-slate-500">
          Understanding the transparent grievance redressal process, privacy guarantees, and SLA commitments.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((f, i) => (
          <Card key={i} className="shadow-xs">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                {f.q}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">{f.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Citizen Rights & Privacy Card */}
      <Card className="border-sky-200 bg-sky-50/50">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Shield className="w-5 h-5 text-sky-600" />
            Citizen Data Privacy & Non-Enumeration Notice
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your personal contact phone and email are never shared publicly or exposed to other citizens. Public tracking
            requires knowledge of both the unique random reference ID and your verified contact detail to prevent enumeration attacks.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
