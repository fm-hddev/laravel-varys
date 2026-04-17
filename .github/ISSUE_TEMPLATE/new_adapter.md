---
name: New adapter proposal
about: Propose a new DataSourceAdapter for Varys
title: '[ADAPTER] '
labels: adapter, enhancement
assignees: ''
---

## Adapter Name

`@varys/adapter-<name>`

## Data Source

What system/service does this adapter connect to?

## Use Case

Why is this adapter needed? What Laravel developer workflow does it support?

## Proposed Interface Coverage

Which methods of `DataSourceAdapter` will this implement?

- [ ] `probe(): Promise<ProbeResult>`
- [ ] `listProcesses(): Promise<Process[]>`
- [ ] `streamLog(target, onLine): Promise<Unsubscribe>`
- [ ] `listBroadcasts(): Promise<Broadcast[]>`
- [ ] `resetBroadcastStream(): Promise<void>`
- [ ] `getQueueStats(): Promise<QueueStats>`
- [ ] `listFailedJobs(): Promise<FailedJob[]>`

## Dependencies

Any npm packages or system requirements needed.

## Contributor

Are you willing to implement this adapter? [ ] Yes [ ] No
