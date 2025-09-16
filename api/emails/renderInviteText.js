export function renderInviteText({ inviterName, userEmail, userRole, workspaceName, acceptInviteUrl }) {
  return `
You're Invited to Join Our SEO Platform
=======================================

Hi ${userEmail},

${inviterName} has invited you to join our SEO Content Platform.

Role: ${userRole}
Workspace: ${workspaceName}

Accept your invitation here:
${acceptInviteUrl}

This invitation will expire in 7 days.

---

What you'll get access to:
- Content Creation: Submit blog posts with our rich text editor
- SEO Management: Audit tools and performance tracking
- Team Collaboration: Workflow management with approvals

Need Help?
Email: support@yourcompany.com
Phone: +1 (555) 123-4567
Live Chat: Available 9 AM - 6 PM EST

---

Headspace Media, LLC
Professional SEO & Content Marketing Services
hello@headspacemedia.com | https://headspacemedia.com

Unsubscribe | Privacy Policy | Terms of Service
  `.trim();
}
