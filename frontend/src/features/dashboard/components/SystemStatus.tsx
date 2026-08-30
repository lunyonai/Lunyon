import {
  Bot,
  Cpu,
  Database,
  Mail,
  Workflow,
} from "lucide-react";

const services = [
  {
    name: "Email Assistant",
    status: "Running",
    progress: 92,
    icon: Mail,
  },
  {
    name: "Workflow Engine",
    status: "Processing",
    progress: 61,
    icon: Workflow,
  },
  {
    name: "Sales Employee",
    status: "Completed",
    progress: 100,
    icon: Bot,
  },
];

export default function SystemStatus() {
  return (
    <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs font-semibold tracking-[0.25em] text-blue-400 uppercase">
            AI SYSTEM
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            Online
          </h2>

        </div>

        <span className="flex items-center gap-2 text-sm text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/>
          Healthy
        </span>

      </div>

      <div className="mt-8 space-y-5">

        {services.map(service=>{

          const Icon = service.icon;

          return(

            <div key={service.name}>

              <div className="flex justify-between">

                <div className="flex items-center gap-3">

                  <Icon className="h-4 w-4 text-blue-400"/>

                  <span className="text-sm text-white">
                    {service.name}
                  </span>

                </div>

                <span className="text-xs text-slate-400">
                  {service.status}
                </span>

              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">

                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${service.progress}%` }}
                />

              </div>

            </div>

          )

        })}

      </div>

      <div className="mt-10 grid grid-cols-2 gap-4">

        <div className="rounded-2xl bg-slate-950/60 p-4">

          <Cpu className="mb-2 text-blue-400"/>

          <p className="text-2xl font-semibold text-white">
            72%
          </p>

          <p className="text-xs text-slate-500">
            CPU Usage
          </p>

        </div>

        <div className="rounded-2xl bg-slate-950/60 p-4">

          <Database className="mb-2 text-violet-400"/>

          <p className="text-2xl font-semibold text-white">
            41%
          </p>

          <p className="text-xs text-slate-500">
            Memory
          </p>

        </div>

      </div>

    </section>
  );
}