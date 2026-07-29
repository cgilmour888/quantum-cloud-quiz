export const STORAGE_KEYS = Object.freeze({
  PROFILE: 'quantumExamLab.profile.v1',
  RESULTS: 'quantumExamLab.results.v1',
  MISSED: 'quantumExamLab.missed.v1',
  CUSTOM_BANKS: 'quantumExamLab.customBanks.v1',
  SETTINGS: 'quantumExamLab.settings.v1',
});

export const MASTERY_THRESHOLD = 90;

export const RANKS = Object.freeze([
  { minimum: 90, label: 'Expert', description: 'Mastery-level command of the material.' },
  { minimum: 80, label: 'Advanced', description: 'Strong command with limited review required.' },
  { minimum: 70, label: 'Intermediate', description: 'Solid foundation with identifiable gaps.' },
  { minimum: 60, label: 'Academic', description: 'Developing knowledge; targeted review advised.' },
  { minimum: 0, label: 'Novice', description: 'Foundational study and repetition recommended.' },
]);

export const TOPIC_GUIDANCE = Object.freeze({
  'Security & Compliance': 'Review IAM, shared responsibility, encryption, audit services, and compliance resources.',
  'Billing, Pricing & Support': 'Review pricing models, budgets, consolidated billing, support plans, and cost tools.',
  'Networking & Content Delivery': 'Review VPC components, routing, connectivity, DNS, load balancing, and CloudFront.',
  Storage: 'Review S3 classes, EBS, EFS, archive tiers, snapshots, and hybrid storage.',
  Databases: 'Review RDS, Aurora, DynamoDB, Redshift, ElastiCache, replicas, and availability patterns.',
  'Compute & Containers': 'Review EC2 purchasing models, Lambda, containers, Auto Scaling, and Elastic Beanstalk.',
  'Monitoring & Management': 'Review CloudWatch, CloudTrail, Config, Systems Manager, Organizations, and IaC tools.',
  'Architecture, Reliability & Performance': 'Review Regions, Availability Zones, elasticity, fault tolerance, and Well-Architected principles.',
  'Migration & Transfer': 'Review DMS, discovery tools, migration services, offline transfer, and hybrid strategies.',
  'Application Integration & Developer Tools': 'Review queues, notifications, APIs, SDK/CLI access, and CI/CD services.',
  'AI, Analytics & Emerging Services': 'Review analytics, streaming, AI/ML, IoT, and intelligent application services.',
  'Cloud Concepts': 'Review cloud value propositions, service models, deployment models, agility, and global reach.',
});

export function getRank(score) {
  const safeScore = Number.isFinite(score) ? score : 0;
  return RANKS.find((rank) => safeScore >= rank.minimum) ?? RANKS.at(-1);
}
