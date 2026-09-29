import Link from 'next/link';
import { ArrowRight, CircleUserRound } from 'lucide-react';

export function ProfileMatchCard() {
  return (
    <section className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]">
          <CircleUserRound size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[#172033]">Your Profile Match</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#64748B]">
            Recommendations are based on the information available in your student profile.
          </p>
        </div>
      </div>

      <div className="mt-5 sm:mt-0 sm:w-64 sm:shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#64748B]">Profile completion</span>
          <span className="font-bold text-[#173F7A]">72%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-[#E3EAF2]"
          role="progressbar"
          aria-label="Profile completion"
          aria-valuenow={72}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full w-[72%] rounded-full bg-[#2563A8]" />
        </div>
        <Link href="/student/profile" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2563A8] hover:underline">
          Complete Profile<ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}