import type { HealthReport as HealthReportType } from '@varys/core';

import { HealthReportItem } from './HealthReportItem';

interface Props {
  report: HealthReportType;
}

export function HealthReport({ report }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {report.adapters.map((adapter) => (
        <HealthReportItem
          key={adapter.id}
          name={adapter.name}
          available={adapter.result.available}
          reason={adapter.result.available ? undefined : adapter.result.reason}
        />
      ))}
    </div>
  );
}
