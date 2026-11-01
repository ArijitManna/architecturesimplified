import { pool, query } from '../config/db.js';
import { authService } from '../services/auth.service.js';
import { env } from '../config/env.js';
import { toSlug } from '../utils/slug.js';

async function upsertCategory(data: {
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
}) {
  const existing = await query('SELECT id FROM categories WHERE slug = $1', [data.slug]);
  if (existing.rows[0]) return existing.rows[0].id as string;
  const result = await query<{ id: string }>(
    `INSERT INTO categories (name, slug, description, icon, display_order, is_active)
     VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING id`,
    [data.name, data.slug, data.description, data.icon, data.display_order]
  );
  return result.rows[0].id;
}

async function upsertTag(name: string) {
  const slug = toSlug(name);
  const existing = await query<{ id: string }>('SELECT id FROM tags WHERE slug = $1', [slug]);
  if (existing.rows[0]) return existing.rows[0].id;
  const result = await query<{ id: string }>(
    'INSERT INTO tags (name, slug) VALUES ($1,$2) RETURNING id',
    [name, slug]
  );
  return result.rows[0].id;
}

async function createTopic(data: {
  category_id: string;
  title: string;
  slug: string;
  short_description: string;
  subtitle: string;
  topic_number: number;
  reading_time: number;
  difficulty: string;
  display_order: number;
  tags: string[];
  sections: { section_type: string; title: string; subtitle?: string; content: string }[];
  diagrams: { title: string; description: string; diagram_type: string }[];
  resources: { title: string; description: string; resource_type: string; url: string }[];
}) {
  const existing = await query('SELECT id FROM topics WHERE category_id = $1 AND slug = $2', [
    data.category_id,
    data.slug,
  ]);
  if (existing.rows[0]) {
    console.log(`  Topic already exists: ${data.title}`);
    return existing.rows[0].id as string;
  }

  const result = await query<{ id: string }>(
    `INSERT INTO topics (
       category_id, title, slug, short_description, subtitle, topic_number,
       reading_time, difficulty, status, display_order, published_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PUBLISHED',$9,NOW()) RETURNING id`,
    [
      data.category_id,
      data.title,
      data.slug,
      data.short_description,
      data.subtitle,
      data.topic_number,
      data.reading_time,
      data.difficulty,
      data.display_order,
    ]
  );
  const topicId = result.rows[0].id;

  for (let i = 0; i < data.sections.length; i++) {
    const s = data.sections[i];
    await query(
      `INSERT INTO topic_sections (topic_id, section_type, title, subtitle, content, display_order)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [topicId, s.section_type, s.title, s.subtitle ?? null, s.content, i]
    );
  }

  for (let i = 0; i < data.diagrams.length; i++) {
    const d = data.diagrams[i];
    await query(
      `INSERT INTO diagrams (topic_id, title, description, diagram_type, display_order, is_interactive)
       VALUES ($1,$2,$3,$4,$5,FALSE)`,
      [topicId, d.title, d.description, d.diagram_type, i]
    );
  }

  for (let i = 0; i < data.resources.length; i++) {
    const r = data.resources[i];
    await query(
      `INSERT INTO resources (topic_id, title, description, resource_type, url, display_order, is_external)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE)`,
      [topicId, r.title, r.description, r.resource_type, r.url, i]
    );
  }

  for (const tagName of data.tags) {
    const tagId = await upsertTag(tagName);
    await query(
      'INSERT INTO topic_tags (topic_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [topicId, tagId]
    );
  }

  console.log(`  Created topic: ${data.title}`);
  return topicId;
}

async function seed() {
  console.log('Seeding database...');

  // Admin user
  const existingAdmin = await query('SELECT id FROM users WHERE email = $1', [env.adminEmail]);
  if (!existingAdmin.rows[0]) {
    const hash = await authService.hashPassword(env.adminPassword);
    await query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,'ADMIN')`,
      [env.adminName, env.adminEmail, hash]
    );
    console.log(`Admin user created: ${env.adminEmail}`);
  } else {
    console.log('Admin user already exists');
  }

  // Categories
  const categories = [
    { name: 'AWS', slug: 'aws', description: 'Amazon Web Services architecture, services, and design patterns explained through mental models.', icon: 'cloud', display_order: 1 },
    { name: 'System Design', slug: 'system-design', description: 'Large-scale system design concepts, trade-offs, and interview preparation.', icon: 'layers', display_order: 2 },
    { name: 'AI / Agentic AI', slug: 'ai-agentic-ai', description: 'AI systems, agents, RAG, and modern generative AI architecture.', icon: 'sparkles', display_order: 3 },
    { name: '.NET', slug: 'dotnet', description: '.NET platform architecture, ASP.NET Core, and cloud-native patterns.', icon: 'code', display_order: 4 },
    { name: 'DevOps', slug: 'devops', description: 'CI/CD, infrastructure as code, observability, and delivery pipelines.', icon: 'git-branch', display_order: 5 },
    { name: 'Databases', slug: 'databases', description: 'Relational and NoSQL database design, scaling, and trade-offs.', icon: 'database', display_order: 6 },
    { name: 'Kubernetes', slug: 'kubernetes', description: 'Container orchestration, workloads, networking, and platform engineering.', icon: 'box', display_order: 7 },
    { name: 'Security', slug: 'security', description: 'Cloud and application security, identity, and defense-in-depth.', icon: 'shield', display_order: 8 },
  ];

  const categoryIds: Record<string, string> = {};
  for (const cat of categories) {
    categoryIds[cat.slug] = await upsertCategory(cat);
  }
  console.log('Categories seeded');

  const awsId = categoryIds['aws'];

  // Tags
  for (const t of ['AWS', 'Storage', 'Networking', 'Compute', 'Database', 'Global Infrastructure', 'S3', 'VPC', 'CloudFront', 'RDS', 'Aurora', 'Certification', 'SAA', 'Messaging']) {
    await upsertTag(t);
  }

  // ---- Topic #01 VPC ----
  const vpcId = await createTopic({
    category_id: awsId,
    title: 'Amazon VPC',
    slug: 'vpc',
    short_description: 'Your private gated community in the AWS cloud — isolate, segment, and control network traffic.',
    subtitle: 'Think of it as a Private Gated Community',
    topic_number: 1,
    reading_time: 14,
    difficulty: 'BEGINNER',
    display_order: 1,
    tags: ['AWS', 'Networking', 'VPC', 'Certification', 'SAA'],
    sections: [
      {
        section_type: 'MENTAL_MODEL',
        title: 'The Mental Model',
        subtitle: 'A Private Gated Community',
        content: `Imagine a private gated community with controlled entry points, streets (subnets), houses (resources), and security guards (security groups / NACLs).

Your VPC is that community inside the AWS cloud. You decide the size of the neighborhood (CIDR), which streets are public vs private, and who gets through the front gate (Internet Gateway / NAT).

Everything you launch in AWS networking starts with understanding this boundary.`,
      },
      {
        section_type: 'INTRODUCTION',
        title: 'What is a VPC?',
        content: `Amazon Virtual Private Cloud (VPC) lets you provision a logically isolated section of the AWS Cloud where you can launch resources in a virtual network that you define.

You control IP address ranges, subnets, route tables, network gateways, and security settings.`,
      },
      {
        section_type: 'CONCEPT',
        title: 'Subnets',
        content: `Subnets carve your VPC into smaller address ranges.

- **Public subnet**: route to an Internet Gateway — resources can have public IPs.
- **Private subnet**: no direct internet route — outbound via NAT Gateway if needed.

Best practice: place application servers in private subnets and only expose load balancers or bastions publicly.`,
      },
      {
        section_type: 'ARCHITECTURE',
        title: 'VPC Architecture',
        content: `A typical production VPC includes:

1. Multi-AZ public and private subnets
2. Internet Gateway for inbound/outbound public traffic
3. NAT Gateway for private subnet outbound
4. Route tables per subnet type
5. Security Groups (stateful) and NACLs (stateless)`,
      },
      {
        section_type: 'SCENARIO',
        title: 'Real-World Scenario',
        content: `You need a three-tier web app: public ALB, private app tier, private database tier.

Design:
- Public subnets in 2 AZs for the ALB
- Private app subnets in 2 AZs for EC2/ECS
- Private DB subnets in 2 AZs for RDS
- NAT for app outbound (patches, APIs)
- Security groups: ALB → App → DB only`,
      },
      {
        section_type: 'EXAM_TIP',
        title: 'Exam Shortcut',
        content: `**Remember:** Security Groups are stateful and attach to ENIs. NACLs are stateless and attach to subnets. Default NACL allows all; custom NACL denies all until you add rules.`,
      },
      {
        section_type: 'KEY_TAKEAWAY',
        title: 'Key Takeaways',
        content: `- VPC = your private network boundary in AWS
- Subnets = public or private based on routes
- IGW for public internet; NAT for private outbound
- Prefer Security Groups; use NACLs for subnet-level controls
- Always design multi-AZ for HA`,
      },
    ],
    diagrams: [
      { title: 'VPC Overview', description: 'VPC with public/private subnets across AZs', diagram_type: 'SVG' },
      { title: 'Traffic Flow', description: 'Internet → IGW → Public → Private via routes', diagram_type: 'SVG' },
    ],
    resources: [
      { title: 'Amazon VPC Documentation', description: 'Official AWS VPC docs', resource_type: 'OFFICIAL_DOC', url: 'https://docs.aws.amazon.com/vpc/' },
      { title: 'VPC Best Practices', description: 'AWS Architecture Center guidance', resource_type: 'REFERENCE', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html' },
    ],
  });

  // ---- Topic #02 RDS vs Aurora ----
  const rdsId = await createTopic({
    category_id: awsId,
    title: 'RDS vs Aurora',
    slug: 'rds-vs-aurora',
    short_description: 'Managed relational databases — when to choose classic RDS versus Aurora\'s cloud-native engine.',
    subtitle: 'Think of it as a Traditional Library vs a Smart Digital Library',
    topic_number: 2,
    reading_time: 12,
    difficulty: 'INTERMEDIATE',
    display_order: 2,
    tags: ['AWS', 'Database', 'RDS', 'Aurora', 'Certification', 'SAA'],
    sections: [
      {
        section_type: 'MENTAL_MODEL',
        title: 'The Mental Model',
        subtitle: 'Traditional Library vs Smart Digital Library',
        content: `**RDS** is like a well-managed traditional library: you get a familiar database engine (MySQL, PostgreSQL, SQL Server…) with AWS handling backups, patching, and failover.

**Aurora** is a smart digital library rebuilt for the cloud: the storage layer is distributed, self-healing, and automatically grows. Readers (replicas) scale fast, and durability is designed across AZs by default.`,
      },
      {
        section_type: 'INTRODUCTION',
        title: 'What is RDS?',
        content: `Amazon RDS is a managed relational database service. You choose an engine, instance size, and storage. AWS handles provisioning, backups, Multi-AZ failover, and maintenance windows.`,
      },
      {
        section_type: 'CONCEPT',
        title: 'What is Aurora?',
        content: `Amazon Aurora is a MySQL- and PostgreSQL-compatible relational database built for the cloud. Storage is separate from compute, replicated six ways across three AZs, and can auto-scale up to 128 TB.`,
      },
      {
        section_type: 'ARCHITECTURE',
        title: 'Architecture Comparison',
        content: `| Feature | RDS | Aurora |
|---------|-----|--------|
| Storage | Attached (gp3/io1) | Distributed cluster volume |
| Replicas | Up to 5 (async) | Up to 15 (shared storage) |
| Failover | 60–120s typical | Often faster (~30s) |
| Scaling storage | Manual / autoscaling | Auto-grows |
| Compatibility | Many engines | MySQL / PostgreSQL |`,
      },
      {
        section_type: 'SCENARIO',
        title: 'When to Choose Which',
        content: `- Need SQL Server / Oracle → **RDS**
- Need MySQL/Postgres with high read scale & cloud storage → **Aurora**
- Simple workloads, cost-sensitive → **RDS**
- Global reads → **Aurora Global Database**`,
      },
      {
        section_type: 'EXAM_TIP',
        title: 'Exam Shortcut',
        content: `Aurora storage is shared across writer + readers. RDS read replicas have their own storage copy. Aurora Serverless is for intermittent/variable workloads.`,
      },
      {
        section_type: 'KEY_TAKEAWAY',
        title: 'Key Takeaways',
        content: `- RDS = managed classic engines
- Aurora = cloud-native MySQL/Postgres
- Aurora storage is the big differentiator
- Pick based on engine needs, scale, and cost`,
      },
    ],
    diagrams: [
      { title: 'RDS Multi-AZ', description: 'Primary and standby with synchronous replication', diagram_type: 'SVG' },
      { title: 'Aurora Cluster Volume', description: 'Shared storage with writer and reader nodes', diagram_type: 'SVG' },
    ],
    resources: [
      { title: 'Amazon Aurora Docs', description: 'Official Aurora documentation', resource_type: 'OFFICIAL_DOC', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/' },
      { title: 'RDS User Guide', description: 'Official RDS documentation', resource_type: 'OFFICIAL_DOC', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/' },
    ],
  });

  // ---- Topic #03 Compute & Messaging ----
  const computeId = await createTopic({
    category_id: awsId,
    title: 'Compute & Messaging',
    slug: 'compute-messaging',
    short_description: 'EC2, Lambda, SQS, and SNS — choose the right compute and decouple with messaging.',
    subtitle: 'Think of it as a Kitchen Brigade and a Ticket System',
    topic_number: 3,
    reading_time: 15,
    difficulty: 'INTERMEDIATE',
    display_order: 3,
    tags: ['AWS', 'Compute', 'Messaging', 'Certification', 'SAA'],
    sections: [
      {
        section_type: 'MENTAL_MODEL',
        title: 'The Mental Model',
        subtitle: 'Kitchen Brigade + Ticket System',
        content: `**Compute** is your kitchen staff: EC2 are full-time chefs who stay on shift; Lambda is a chef who appears only when an order arrives and leaves when done.

**Messaging** is the ticket rail: SQS is a queue of tickets waiting to be cooked (pull); SNS is a loudspeaker announcing "order up!" to many stations at once (push/fan-out).`,
      },
      {
        section_type: 'CONCEPT',
        title: 'Compute Options',
        content: `- **EC2**: full control VMs — long-running, custom OS, predictable load
- **Lambda**: event-driven functions — scale to zero, pay per use
- **ECS/EKS**: containers when you need orchestration
- **Fargate**: containers without managing servers`,
      },
      {
        section_type: 'CONCEPT',
        title: 'SQS vs SNS',
        content: `- **SQS**: queue — one consumer processes a message (with competing consumers)
- **SNS**: pub/sub — fan-out to many subscribers (SQS, Lambda, HTTP, email)
- Pattern: SNS → multiple SQS queues for fan-out with buffering`,
      },
      {
        section_type: 'ARCHITECTURE',
        title: 'Decoupled Architecture',
        content: `Producer → SNS → SQS → Lambda/EC2 workers

This pattern absorbs spikes, isolates failures, and lets each consumer scale independently.`,
      },
      {
        section_type: 'SCENARIO',
        title: 'Image Processing Pipeline',
        content: `Users upload images to S3. S3 event → SNS → SQS → Lambda workers that generate thumbnails. Dead-letter queue catches poison messages.`,
      },
      {
        section_type: 'EXAM_TIP',
        title: 'Exam Shortcut',
        content: `SQS Standard = at-least-once + best-effort ordering. SQS FIFO = exactly-once processing + ordered. SNS does not buffer — pair with SQS when you need durability.`,
      },
      {
        section_type: 'KEY_TAKEAWAY',
        title: 'Key Takeaways',
        content: `- Match compute to workload shape
- Decouple with SQS/SNS
- Fan-out = SNS + SQS
- Always plan for DLQs and retries`,
      },
    ],
    diagrams: [
      { title: 'SNS Fan-out to SQS', description: 'Publisher fans out to multiple queues', diagram_type: 'SVG' },
      { title: 'Compute Decision Guide', description: 'When to use EC2 vs Lambda vs containers', diagram_type: 'SVG' },
    ],
    resources: [
      { title: 'Amazon SQS Docs', description: 'Official SQS documentation', resource_type: 'OFFICIAL_DOC', url: 'https://docs.aws.amazon.com/sqs/' },
      { title: 'Amazon SNS Docs', description: 'Official SNS documentation', resource_type: 'OFFICIAL_DOC', url: 'https://docs.aws.amazon.com/sns/' },
    ],
  });

  // ---- Topic #04 Amazon S3 (full example) ----
  const s3Id = await createTopic({
    category_id: awsId,
    title: 'Amazon S3',
    slug: 's3',
    short_description: 'Object storage built for any amount of data — durable, scalable, and the foundation of many AWS architectures.',
    subtitle: "Think of it as a Hospital's Document Warehouse",
    topic_number: 4,
    reading_time: 12,
    difficulty: 'BEGINNER',
    display_order: 4,
    tags: ['AWS', 'Storage', 'S3', 'Certification', 'SAA'],
    sections: [
      {
        section_type: 'MENTAL_MODEL',
        title: 'The Mental Model',
        subtitle: "A Hospital's Document Warehouse",
        content: `Imagine a hospital storing reports, X-rays, MRI scans and legal documents in a large document warehouse.

- **Buckets** are labeled rooms or shelves by department
- **Objects** are individual files (reports, images)
- **Keys** are the exact shelf labels / path to find a document
- **Storage classes** decide if something sits on the front desk (hot) or deep archive vault (cold)
- **Lifecycle policies** automatically move old records to cheaper storage
- **Object Lock** is like a legal hold — nobody can alter or delete until the hold expires

Amazon S3 is that warehouse for the cloud: virtually unlimited, eleven nines durable, and accessible from anywhere with the right credentials.`,
      },
      {
        section_type: 'INTRODUCTION',
        title: 'What is S3?',
        content: `Amazon Simple Storage Service (S3) is object storage built to store and retrieve any amount of data from anywhere.

It is not a file system and not a block device — you store objects (data + metadata) addressed by a key inside a bucket.`,
      },
      {
        section_type: 'CONCEPT',
        title: 'Bucket',
        content: `A **bucket** is a container for objects. Bucket names are globally unique.

Common practices:
- One bucket per environment/app domain
- Enable Block Public Access by default
- Use bucket policies + IAM for access control
- Turn on versioning for critical data`,
      },
      {
        section_type: 'CONCEPT',
        title: 'Object',
        content: `An **object** is the fundamental entity in S3: data + metadata + key.

- Max object size: 5 TB
- Use multipart upload for large files
- Keys can look like folders (\`images/2024/photo.jpg\`) but S3 is flat storage with prefixes`,
      },
      {
        section_type: 'DEEP_DIVE',
        title: 'Storage Classes',
        content: `| Class | Use case |
|-------|----------|
| Standard | Frequently accessed |
| Standard-IA | Infrequent, rapid access |
| One Zone-IA | Infrequent, single AZ |
| Glacier Instant | Archive with ms access |
| Glacier Flexible | Archive, minutes–hours |
| Glacier Deep Archive | Lowest cost, 12 hours |
| Intelligent-Tiering | Auto-moves based on access |`,
      },
      {
        section_type: 'DEEP_DIVE',
        title: 'Lifecycle',
        content: `Lifecycle rules automatically transition or expire objects.

Example:
1. Upload → Standard
2. After 30 days → Standard-IA
3. After 90 days → Glacier
4. After 365 days → expire / Deep Archive

Use prefixes and tags to target rules.`,
      },
      {
        section_type: 'DEEP_DIVE',
        title: 'Object Lock',
        content: `S3 Object Lock provides WORM (Write Once Read Many) protection.

Modes:
- **Governance**: privileged users can override with special permissions
- **Compliance**: nobody — including root — can overwrite/delete until retention ends

Requires versioning. Critical for regulated industries.`,
      },
      {
        section_type: 'CONCEPT',
        title: 'Durability & Versioning',
        content: `S3 is designed for **99.999999999% (11 nines)** durability.

Versioning keeps multiple variants of an object. Combined with MFA Delete and Object Lock, you get strong protection against accidental or malicious deletion.`,
      },
      {
        section_type: 'SCENARIO',
        title: 'Real-World Scenario',
        content: `A media company stores original 4K videos and serves them globally.

Architecture:
- S3 Standard for hot masters
- CloudFront in front for CDN delivery
- Lifecycle to IA / Glacier for old projects
- Object Lock compliance mode for legal evidence clips
- S3 Event → Lambda for thumbnail generation`,
      },
      {
        section_type: 'EXAM_TIP',
        title: 'Exam Shortcut',
        content: `**S3 is object storage, not a filesystem.** Cross-Region Replication needs versioning. Presigned URLs grant temporary access without making the bucket public. Static website hosting is possible but CloudFront + OAC is preferred.`,
      },
      {
        section_type: 'KEY_TAKEAWAY',
        title: 'Key Takeaways',
        content: `- S3 = durable object warehouse
- Buckets hold objects addressed by keys
- Storage classes + lifecycle = cost control
- Object Lock = WORM / compliance
- Pair with CloudFront for global delivery`,
      },
    ],
    diagrams: [
      { title: 'Main S3 Architecture', description: 'Users → CloudFront → S3 Bucket with storage classes, lifecycle, and Object Lock', diagram_type: 'SVG' },
      { title: 'Storage Classes', description: 'Hot to cold storage class spectrum', diagram_type: 'SVG' },
      { title: 'Lifecycle Flow', description: 'Object transitions over time', diagram_type: 'SVG' },
      { title: 'Object Lock', description: 'WORM retention and legal hold model', diagram_type: 'SVG' },
      { title: 'S3 Decision Guide', description: 'Choosing storage class and access pattern', diagram_type: 'SVG' },
    ],
    resources: [
      { title: 'Amazon S3 Documentation', description: 'Official S3 user guide', resource_type: 'OFFICIAL_DOC', url: 'https://docs.aws.amazon.com/s3/' },
      { title: 'AWS Architecture Center — S3', description: 'Reference architectures using S3', resource_type: 'REFERENCE', url: 'https://aws.amazon.com/architecture/' },
      { title: 'S3 Storage Classes', description: 'Compare S3 storage classes', resource_type: 'CHEAT_SHEET', url: 'https://aws.amazon.com/s3/storage-classes/' },
    ],
  });

  // ---- Topic #05 CloudFront vs Global Accelerator ----
  const cfId = await createTopic({
    category_id: awsId,
    title: 'CloudFront vs Global Accelerator',
    slug: 'cloudfront-vs-global-accelerator',
    short_description: 'Two ways to go global — CDN caching at the edge versus network-path optimization with static anycast IPs.',
    subtitle: 'Think of it as a Network of Newsstands vs a VIP Express Highway',
    topic_number: 5,
    reading_time: 13,
    difficulty: 'INTERMEDIATE',
    display_order: 5,
    tags: ['AWS', 'Global Infrastructure', 'CloudFront', 'Networking', 'Certification', 'SAA'],
    sections: [
      {
        section_type: 'MENTAL_MODEL',
        title: 'The Mental Model',
        subtitle: 'Newsstands vs VIP Express Highway',
        content: `**CloudFront** is a network of neighborhood newsstands. Popular content is copied close to readers so they get it instantly. Best when the same content is requested repeatedly (static assets, videos, APIs with cacheable responses).

**Global Accelerator** is a VIP express highway into AWS. Traffic enters at the nearest edge, then rides the AWS backbone to your regional endpoints. IPs stay static. Best when you need performance and failover for dynamic, non-cacheable traffic (gaming, IoT, VoIP, APIs).`,
      },
      {
        section_type: 'CONCEPT',
        title: 'CloudFront',
        content: `CloudFront is a CDN. Edge locations cache content from an origin (S3, ALB, custom origin).

Key ideas:
- Cache behaviors and TTLs
- Origin Access Control (OAC) for S3
- Signed URLs/cookies for private content
- Geographic restrictions and WAF integration`,
      },
      {
        section_type: 'CONCEPT',
        title: 'Global Accelerator',
        content: `Global Accelerator provides two static anycast IP addresses that act as a fixed entry point.

Traffic is routed over the AWS global network to the optimal healthy endpoint (ALB, NLB, EC2, Elastic IP) based on health, geography, and routing policies.`,
      },
      {
        section_type: 'DEEP_DIVE',
        title: 'Caching',
        content: `CloudFront shines when responses can be cached. Global Accelerator does **not** cache — it optimizes the network path for every request.`,
      },
      {
        section_type: 'DEEP_DIVE',
        title: 'Network Path & Static Anycast IP',
        content: `- CloudFront: clients hit a cache edge; origin fetch on miss
- Global Accelerator: clients hit anycast IP → AWS backbone → regional endpoint
- Static IPs: Global Accelerator yes; CloudFront uses domain names (IPs can change)`,
      },
      {
        section_type: 'DEEP_DIVE',
        title: 'Failover',
        content: `Both support multi-region designs.

- CloudFront: origin groups with primary/secondary failover
- Global Accelerator: endpoint groups per region with traffic dials and health checks`,
      },
      {
        section_type: 'ARCHITECTURE',
        title: 'Comparison',
        content: `| | CloudFront | Global Accelerator |
|---|------------|-------------------|
| Primary job | CDN / cache | Network acceleration |
| Caches content | Yes | No |
| Static IPs | No | Yes (2 anycast) |
| Best for | Static & cacheable | Dynamic TCP/UDP |
| Protocol | HTTP/HTTPS (and some WS) | TCP / UDP |`,
      },
      {
        section_type: 'SCENARIO',
        title: 'Real-World Scenario',
        content: `Video on demand site → **CloudFront + S3**
Multiplayer game backends needing stable IPs → **Global Accelerator + NLB**
Many apps use both: CloudFront for assets, Global Accelerator for APIs.`,
      },
      {
        section_type: 'EXAM_TIP',
        title: 'Exam Shortcut',
        content: `Need caching or static website acceleration → CloudFront. Need static IPs, non-HTTP, or gaming/IoT performance → Global Accelerator. Non-HTTP protocols are a strong Global Accelerator signal.`,
      },
      {
        section_type: 'KEY_TAKEAWAY',
        title: 'Key Takeaways',
        content: `- CloudFront = cache at the edge
- Global Accelerator = fast path + static IPs
- They solve different problems; sometimes used together
- Exam: cache vs network vs protocol drives the choice`,
      },
    ],
    diagrams: [
      { title: 'Main Comparison', description: 'Side-by-side CloudFront vs Global Accelerator', diagram_type: 'SVG' },
      { title: 'CloudFront Cache Flow', description: 'Client → Edge cache → Origin on miss', diagram_type: 'SVG' },
      { title: 'Global Accelerator Traffic Flow', description: 'Anycast edge → AWS backbone → regional endpoint', diagram_type: 'SVG' },
      { title: 'Failover', description: 'Multi-region endpoint failover patterns', diagram_type: 'SVG' },
      { title: 'Decision Guide', description: 'When to pick CloudFront vs Global Accelerator', diagram_type: 'SVG' },
    ],
    resources: [
      { title: 'Amazon CloudFront Docs', description: 'Official CloudFront documentation', resource_type: 'OFFICIAL_DOC', url: 'https://docs.aws.amazon.com/cloudfront/' },
      { title: 'Global Accelerator Docs', description: 'Official Global Accelerator documentation', resource_type: 'OFFICIAL_DOC', url: 'https://docs.aws.amazon.com/global-accelerator/' },
    ],
  });

  // Learning path
  const pathExisting = await query('SELECT id FROM learning_paths WHERE slug = $1', [
    'aws-solutions-architect-associate',
  ]);
  let pathId: string;
  if (!pathExisting.rows[0]) {
    const pathResult = await query<{ id: string }>(
      `INSERT INTO learning_paths (title, slug, description, difficulty, display_order, is_active)
       VALUES ($1,$2,$3,'INTERMEDIATE',1,TRUE) RETURNING id`,
      [
        'AWS Solutions Architect Associate (SAA-C03)',
        'aws-solutions-architect-associate',
        'A structured path through core AWS architecture topics — networking, storage, compute, databases, and global delivery — using mental models and visual architecture.',
      ]
    );
    pathId = pathResult.rows[0].id;
    const topicOrder = [vpcId, rdsId, computeId, s3Id, cfId];
    for (let i = 0; i < topicOrder.length; i++) {
      await query(
        `INSERT INTO learning_path_topics (learning_path_id, topic_id, display_order, is_required)
         VALUES ($1,$2,$3,TRUE)`,
        [pathId, topicOrder[i], i]
      );
    }
    console.log('Learning path created');
  } else {
    pathId = pathExisting.rows[0].id as string;
    console.log('Learning path already exists');
  }

  // Challenge
  const challengeExisting = await query('SELECT id FROM challenges WHERE slug = $1', [
    'global-video-delivery-platform',
  ]);
  if (!challengeExisting.rows[0]) {
    const chResult = await query<{ id: string }>(
      `INSERT INTO challenges (title, slug, description, difficulty, scenario, requirements, status, challenge_number)
       VALUES ($1,$2,$3,'INTERMEDIATE',$4,$5::jsonb,'PUBLISHED',3) RETURNING id`,
      [
        'Design a Global Video Delivery Platform',
        'global-video-delivery-platform',
        'Design a cost-aware architecture that stores and serves video content to a worldwide audience with low latency.',
        'A media startup needs to upload, process, store, and deliver videos to users across multiple continents. Peak traffic is spiky during product launches. Content must remain durable and cost-optimized as the library grows.',
        JSON.stringify([
          'Store and serve video content globally',
          'Low latency for viewers worldwide',
          'Process uploads asynchronously (thumbnails, transcoding)',
          'Cost optimized for a growing archive',
          'Secure access to premium content',
        ]),
      ]
    );
    const challengeId = chResult.rows[0].id;
    const options = [
      {
        title: 'S3 + CloudFront + MediaConvert + Lambda',
        description: 'Store masters in S3, CDN with CloudFront, async processing with MediaConvert/Lambda, signed URLs for premium content.',
        is_correct: true,
        explanation:
          'This is the classic AWS media pattern: durable object storage, edge caching for delivery, event-driven processing, and lifecycle policies for cost.',
      },
      {
        title: 'EBS volumes attached to a single EC2 in one region',
        description: 'Store videos on large EBS volumes and serve directly from one EC2 instance.',
        is_correct: false,
        explanation: 'Single region, single instance, not globally scalable, and EBS is not ideal for large media libraries.',
      },
      {
        title: 'RDS for binary video blobs + ALB',
        description: 'Store video files as BLOBs in RDS and serve through an Application Load Balancer.',
        is_correct: false,
        explanation: 'Relational databases are the wrong tool for large binary media objects; cost and performance suffer.',
      },
      {
        title: 'Global Accelerator only, no object storage',
        description: 'Use Global Accelerator in front of regional app servers that stream from local disk.',
        is_correct: false,
        explanation: 'Global Accelerator helps networking but does not replace durable object storage or CDN caching for video delivery.',
      },
    ];
    for (let i = 0; i < options.length; i++) {
      const o = options[i];
      await query(
        `INSERT INTO challenge_options (challenge_id, title, description, is_correct, explanation, display_order)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [challengeId, o.title, o.description, o.is_correct, o.explanation, i]
      );
    }
    console.log('Challenge created');
  } else {
    console.log('Challenge already exists');
  }

  void pathId;
  console.log('Seed completed successfully.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
