---
title: 'Decision Making: Picking Object Storage'
date: 2025-11-08 08:04:44 Z
description: ''
preview: ''
layout: post
---

- [Prompt](#prompt)
- [Report: Object Storage Cost Model](#report-object-storage-cost-model)
  - [Pricing assumptions (sources used)](#pricing-assumptions-sources-used)
  - [Cost model calculations (straight arithmetic)](#cost-model-calculations-straight-arithmetic)
    - [Cloudflare R2](#cloudflare-r2)
    - [Amazon S3 (approximate)](#amazon-s3-approximate)
    - [Backblaze B2](#backblaze-b2)
    - [Wasabi](#wasabi)
  - [Results (summary table)](#results-summary-table)
  - [Observations and recommendations](#observations-and-recommendations)
  - [Appendix — raw arithmetic](#appendix--raw-arithmetic)
  - [Sources used for pricing inputs](#sources-used-for-pricing-inputs)

![AI Generated Content](</assets/badges/AI Labels - AI - Expanded.svg>)

## Prompt

    You are a software architect and assigned to decision task about picking object storage for large scale web app.

    You have to consider:

    - Durability
    - Reliability
    - Cost
    - Large storage (>10 TB)
    - High traffict (>400 TB)

    Which object storage would you pick.

    Give detailed reasoning, why you've picked

<https://chatgpt.com/c/690ef6f9-56e4-8328-99fa-7498f24d0373>

Pick: **Cloudflare R2 + Cloudflare CDN (Workers/Pages)**.

Reasoning, short and concrete.

1. Cost for heavy outbound traffic wins.
   Cloudflare R2 has **no egress (outbound bandwidth) charges**, so at 400+ TB/month you avoid the largest single cloud bill driver. That alone can save tens of thousands per month versus hyperscalers. ([Cloudflare][1])

2. Durability and reliability are enterprise-grade.
   R2 advertises **11 nines (99.999999999%) durability** and is designed to replicate across regions for availability—same order of durability as S3/GCS/Azure. Cloudflare’s global network plus business/enterprise SLAs provide high availability and low-latency delivery when paired with their CDN. ([Cloudflare Docs][2])

3. Operational fit for a high-traffic web app.
   Serving active content from R2 plus Cloudflare’s edge cache (Workers, Pages, CDN) minimizes origin reads. That reduces operation counts and latencies while keeping egress at zero for end users. For web apps that serve many small reads or media at scale this architecture is both cheaper and faster than “store in S3 + serve from S3” models. ([Cloudflare][1])

4. Alternatives considered and why they lost:

- **AWS S3 / GCS / Azure Blob**: best-in-class durability and ecosystem. But egress and high-request costs at large outbound volume (400+ TB) make them expensive unless you build aggressive CDN caching or negotiate enterprise discounts. ([Amazon Web Services, Inc.][3])
- **Wasabi / Backblaze B2**: much cheaper storage and some offer free/no/limited egress models (Wasabi advertises no egress fees; Backblaze gives free egress up to ~3x stored per month). Good cost options for cold/backup or when you control CDN topology. They lack Cloudflare’s integrated global edge CDN and edge compute. For a high-traffic web app R2+Cloudflare edge is operationally simpler. ([Wasabi][4])
- **Self-hosted (MinIO/Ceph)**: gives control and lower raw storage cost at scale but pushes operational complexity, staffing, and multi-datacenter durability design onto you. For 400+ TB/month outgoing traffic you still need a global CDN to avoid huge bandwidth costs. ([MinIO][5])

5. Practical trade-offs and mitigations

- R2 charges for API operations and read/write operations. If you have very high request rates for many small objects, operations cost can matter. Mitigate by batching, caching, and using long cache TTLs at the edge. ([Cloudflare][1])
- Vendor lock-in and features: R2 is S3-compatible in many ways but not feature-identical. If you need advanced S3 features (e.g., certain lifecycle behaviors, S3 Object Lambda, complex cross-region replication policies) test compatibility first. Keep an abstraction layer in your code to switch backends if needed. ([Cloudflare][1])
- Enterprise negotiation: if you already have large cloud contracts with AWS/Azure/GCP, ask for egress discounts or use a hybrid: store cold data in cheaper providers and hot/served objects in R2. This can optimize overall cost. ([Amazon Web Services, Inc.][3])

6. Implementation blueprint (minimal, high-leverage)

- Put public-serving assets (images, videos, static files) in **R2**.
- Front them with **Cloudflare CDN** + Workers for cache-control, auth, and edge logic.
- Use origin-pull caching: Cloudflare will cache objects at edge and avoid repeated R2 reads.
- Monitor the “Class B” read operation volume and tune cache TTLs to control operation costs. ([Cloudflare][1])

Bottom line: **Cloudflare R2 + Cloudflare CDN** balances equal-tier durability and superior cost for heavy outbound traffic. It minimizes the dominant cost vector (egress) while delivering global performance and enterprise SLAs. If you need lowest raw $/TB storage and are willing to manage a CDN separately, consider **Wasabi** or **Backblaze B2** as cheaper storage backends, but you will still want Cloudflare or another global CDN in front of them. ([Cloudflare][1])

---

## Report: Object Storage Cost Model

[Download the Object Storage Cost Model Report (PDF)](/assets/pdf/object-storage-cost-model-10tb-storage-100tb-egress-report.pdf)

**Scenario inputs**

- Storage: **10 TB** (10,000 GB)
- Monthly egress: **100 TB** (100,000 GB)
- Time window: 1 month

**Providers modeled**

- Cloudflare R2 (standard)
- Amazon S3 (Standard, us-east-1 pricing tiers approximated)
- Backblaze B2 (standard B2 with 3x free egress policy)
- Wasabi Hot Cloud Storage (flat-rate, no egress/API fees)

---

### Pricing assumptions (sources used)

- **Cloudflare R2**: $0.015 per GB-month storage. Class A ops $4.50 per million. Class B ops $0.36 per million. Zero egress. (Cloudflare R2 pricing page)
- **Amazon S3 (Standard)**: $0.023 per GB-month for first 50 TB. Data transfer out approximated at $0.09/GB (first tiers). Typical S3 request costs are small relative to egress for this scenario.
- **Backblaze B2**: $0.005 per GB-month storage. Free egress up to 3x average monthly storage (3 * 10 TB = 30 TB). Excess egress charged $0.01/GB.
- **Wasabi**: $6.99 per TB-month (assumed active/hot plan). Wasabi advertises no egress or API fees.

> Notes: prices pulled from each vendor's published pages and recent pricing summaries. Use these as model inputs, not guaranteed contract prices. Always confirm region and volume discounts with the vendor.

---

### Cost model calculations (straight arithmetic)

**Common conversions**: 1 TB = 1,000 GB. 10 TB = 10,000 GB. 100 TB = 100,000 GB.

#### Cloudflare R2

- Storage: 10,000 GB * $0.015/GB = **$150 / month**.
- Egress: **$0** (zero egress fee).
- Operations: modelled in three request profiles below.

**R2 request profiles**

| Profile | Class A (writes) | Class B (reads) | Ops cost | Total (storage + ops) |
| ------: | ---------------: | --------------: | -------: | --------------------: |
|     Low |              10k |            100k |   $0.081 |               $150.08 |
|  Medium |        1,000,000 |      10,000,000 |    $8.10 |               $158.10 |
|    High |       10,000,000 |     100,000,000 |   $81.00 |               $231.00 |

> Class A $4.50 per 1M; Class B $0.36 per 1M. Ops are small relative to egress in this scenario.

---

#### Amazon S3 (approximate)

- Storage: 10,000 GB * $0.023/GB = **$230 / month**.
- Egress: 100,000 GB * $0.09/GB = **$9,000 / month**.
- Requests: modest assumed profile (10M GET, 1M PUT) ≈ **$9**.

**Total S3 (approx)** = **$9,239 / month**.

> S3 cost is dominated by egress.

---

#### Backblaze B2

- Storage: 10,000 GB * $0.005/GB = **$50 / month**.
- Free egress allowance: 3 × avg storage = 30 TB free (30,000 GB). Thus chargeable egress = 100,000 − 30,000 = **70,000 GB**.
- Egress cost: 70,000 GB * $0.01/GB = **$700**.
- Requests/transactions: small for typical read patterns (not modeled here).

**Total Backblaze B2** = **$50 + $700 = $750 / month**.

---

#### Wasabi

- Storage: 10 TB × $6.99/TB = **$69.90 / month**.
- Egress: advertised **$0** (no egress fees) on standard offering.
- API requests: **$0**.

**Total Wasabi** = **$69.90 / month**.

---

### Results (summary table)

| Provider      | Storage ($/mo) | Egress ($/mo) | Ops ($/mo) | Total ($/mo, mid-profile) |
| ------------- | -------------: | ------------: | ---------: | ------------------------: |
| Cloudflare R2 |         150.00 |          0.00 |       8.10 |                **158.10** |
| Amazon S3     |         230.00 |      9,000.00 |       9.00 |              **9,239.00** |
| Backblaze B2  |          50.00 |        700.00 |         ~0 |                **750.00** |
| Wasabi        |          69.90 |          0.00 |       0.00 |                 **69.90** |

> Mid-profile for R2 assumes 1M Class A and 10M Class B requests per month. S3 ops are a small fraction of the total cost.

---

### Observations and recommendations

1. **Egress is the dominant cost** for public-facing apps with heavy outbound traffic. S3 becomes expensive when you serve hundreds of TBs. In our scenario S3 egress (~$9k) dwarfs storage fees.

2. **Wasabi and Cloudflare R2 are the lowest-cost options here**. Wasabi shows the cheapest raw storage price in this model and advertises no egress/API fees. Cloudflare R2 is competitive on storage and has zero egress plus a global edge CDN integration which reduces origin reads and latency.

3. **Backblaze B2 is a middle-ground**. Very cheap storage but egress above 3× stored is billable. For 100 TB egress with 10 TB stored it costs significantly more than Wasabi/R2 but much less than S3.

4. **Operational trade-offs**

   - Wasabi gives simple predictable costs but requires you to manage CDN/edge distribution to achieve global low-latency delivery. Wasabi offers enterprise features but check minimum-storage requirements and contract terms.
   - R2 integrates with Cloudflare’s CDN/Workers. If your app is edge-heavy and you can use Cloudflare caching effectively you will both save on origin read ops and deliver lower latency to users.
   - Backblaze is attractive when you can align egress to the 3× free policy or accept the $0.01/GB excess.
   - S3 wins on ecosystem, advanced features, and enterprise SLAs. It loses on cost for heavy egress workloads unless you negotiate an enterprise egress discount or put a very effective CDN layer in front.

5. **If you control caching**: Cloudflare R2 + Cloudflare CDN wins operationally. Wasabi wins on pure dollar-per-TB if you are willing to front it with a CDN.

6. **Recommendation**: For a public-facing high-traffic web app with 10 TB stored and 100 TB out per month, choose **Cloudflare R2 + Cloudflare CDN** if you want a managed integrated stack with zero egress and edge compute. If your only decision criterion is absolute lowest dollar per month and you can manage CDN separately then **Wasabi** is slightly cheaper in this model.

---

### Appendix — raw arithmetic

- R2 storage: 10,000 GB × $0.015 = $150
- R2 ops (medium): 1M × $4.50/1M + 10M × $0.36/1M = $4.50 + $3.60 = $8.10
- S3 storage: 10,000 GB × $0.023 = $230
- S3 egress: 100,000 GB × $0.09 = $9,000
- Backblaze storage: 10,000 GB × $0.005 = $50
- Backblaze egress charged: (100 − 30) TB × 1,000 GB/TB × $0.01/GB = 70,000 × $0.01 = $700
- Wasabi storage: 10 TB × $6.99/TB = $69.90

---

### Sources used for pricing inputs

Vendor pricing pages and recent pricing summaries were consulted for each provider. Confirm current region, discounts and contract terms before procurement.

- Cloudflare R2 pricing page
- AWS S3 pricing page (us-east-1 standard)
- Backblaze B2 pricing and transactions pages
- Wasabi pricing pages

---

*End of report.*

[1]: https://www.cloudflare.com/developer-platform/products/r2/?utm_source=chatgpt.com "Cloudflare R2 | Zero Egress Fee Object Storage"
[2]: https://developers.cloudflare.com/r2/reference/durability/?utm_source=chatgpt.com "Durability - R2"
[3]: https://aws.amazon.com/s3/pricing/?utm_source=chatgpt.com "S3 Pricing"
[4]: https://wasabi.com/?utm_source=chatgpt.com "Wasabi: Store More and Do More with Your DataWasabi Hot Cloud Storage Pricing"
[5]: https://min.io/product/s3-compatibility?utm_source=chatgpt.com "AWS S3 Compatible Object Storage - MinIO"
