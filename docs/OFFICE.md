# Office Guide

Open `/office` and sign in with an account created by an administrator. The first administrator is created using `npm run admin:create`; this is separate from database account configuration.

## Roles

Editors can prepare page content and articles, upload media, and request review. Administrators additionally publish content, edit identity settings, manage accounts, and view consultation records and reports.

## Editing the portal

Use **Konten Portal** to edit the structured sections: hero, introduction, services, approach, FAQ, contact copy, and media presets. Sections can be reordered or hidden while the hero and footer retain their fixed positions. **Pengaturan** contains identity, colors, logos, and navigation.

Save as a draft before opening the saved-draft preview or requesting review. Publishing makes the saved revision visible to visitors. Editing an already-published document does not immediately change the public version. If a revision conflict appears, load the latest version before resubmitting; do not assume an earlier save succeeded.

## News

Use **Berita** to create an article. Provide a unique lowercase, hyphen-separated slug, category, summary, and structured body. Choose an uploaded cover image and meaningful alternative text, or leave the cover empty. SEO fields fall back to the article title and summary.

Drafts and review requests stay private. Administrators publish or withdraw an article. The homepage news section remains hidden until an article is published. Withdrawal removes the article from the public listing and its URL returns 404.

## Media

Use **Media** to upload JPEG, PNG, or WebP files up to 5 MB. The server verifies the actual image and optimizes it. Uploaded SVG is not supported; bundled SVG brand assets remain available in identity settings. Referenced images cannot be deleted, including images referenced by archived publication versions.

## Consultations and reports

**Konsultasi** lists school requests. Open a record to review contact details, selected services, and the message. Use the status sequence **Baru** (New), **Diproses** (In progress), and **Selesai** (Completed), and save internal notes.

**Laporan** filters requests by dates, status, and service and exports the matching records to CSV. Dates use Asia/Jakarta. Service totals may exceed the request count because one request can select several services.

Only administrators can access this data. Deleting a request permanently removes its contact details and content from the active database; existing backups remain subject to your backup retention policy. This release does not send automatic email or WhatsApp notifications.

## Accounts

Administrators can add admin/editor accounts, disable other accounts, and reset passwords through **Pengguna**. Resetting or disabling an account revokes its sessions. A user cannot disable their own account. Use `npm run admin:reset` on the server if account access must be recovered.
