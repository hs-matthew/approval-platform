export function renderInviteEmail({ inviterName, userEmail, userRole, workspaceName, acceptInviteUrl }) {
  // Capitalize role nicely
  const roleDisplay = userRole.charAt(0).toUpperCase() + userRole.slice(1);
  const { APP_HOST } = process.env;
  const logoUrl = `${APP_HOST}/assets/hs-logo-animated.gif`; // path to logo

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>You're Invited</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:Arial, sans-serif; color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:6px; overflow:hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#667eea,#764ba2); padding:40px 20px;">
              <img src="${logoUrl}" alt="Headspace Media Logo" width="60" height="60" style="display:block; margin-bottom:16px; border-radius:8px;" />
              <h1 style="color:#ffffff; font-size:24px; margin:0;">SEO Content Platform</h1>
              <p style="color:#e2e8f0; font-size:16px; margin:8px 0 0;">Professional Content Management & SEO Services</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="color:#1a202c; font-size:22px; margin-bottom:16px; text-align:center;">You're Invited!</h2>
              <p style="color:#4a5568; font-size:16px; margin-bottom:12px; text-align:center;">
                ${inviterName} has invited you to join our SEO Content Platform.
              </p>
              <p style="color:#4a5568; font-size:16px; margin-bottom:20px; text-align:center;">
                Start collaborating on content creation and SEO management today.
              </p>

              <!-- Invitation Details -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0; border:1px solid #e2e8f0; border-radius:6px;">
                <tr>
                  <td colspan="2" style="background:#f7fafc; padding:12px; font-weight:bold; font-size:16px; color:#2d3748;">Invitation Details</td>
                </tr>
                <tr>
                  <td style="padding:10px; font-size:14px; color:#4a5568;">Invited by:</td>
                  <td style="padding:10px; font-size:14px; color:#2d3748; font-weight:bold;" align="right">${inviterName}</td>
                </tr>
                <tr>
                  <td style="padding:10px; font-size:14px; color:#4a5568;">Your email:</td>
                  <td style="padding:10px; font-size:14px; color:#2d3748; font-weight:bold;" align="right">${userEmail}</td>
                </tr>
                <tr>
                  <td style="padding:10px; font-size:14px; color:#4a5568;">Role:</td>
                  <td style="padding:10px; font-size:14px; color:#2d3748; font-weight:bold;" align="right">${roleDisplay}</td>
                </tr>
                <tr>
                  <td style="padding:10px; font-size:14px; color:#4a5568;">Workspace:</td>
                  <td style="padding:10px; font-size:14px; color:#2d3748; font-weight:bold;" align="right">${workspaceName}</td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align:center; margin:30px 0;">
                <a href="${acceptInviteUrl}" style="display:inline-block; background:#4299e1; color:#fff; text-decoration:none; padding:14px 28px; border-radius:6px; font-size:16px; font-weight:bold;">
                  Accept Invitation
                </a>
                <p style="margin-top:12px; font-size:13px; color:#4a5568;">This invitation will expire in 7 days.</p>
              </div>

              <!-- Features -->
              <h3 style="color:#2d3748; font-size:18px; margin:24px 0 12px; text-align:center;">What you'll get access to:</h3>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" style="padding:10px; font-size:14px; color:#4a5568;">
                    <strong>📝 Content Creation</strong><br/>
                    Create and submit blog posts with our advanced editor
                  </td>
                  <td valign="top" style="padding:10px; font-size:14px; color:#4a5568;">
                    <strong>📊 SEO Management</strong><br/>
                    Comprehensive audit tools & performance tracking
                  </td>
                </tr>
                <tr>
                  <td valign="top" style="padding:10px; font-size:14px; color:#4a5568;">
                    <strong>🤝 Team Collaboration</strong><br/>
                    Seamless workflow management with approvals
                  </td>
                  <td></td>
                </tr>
              </table>

              <!-- Support -->
              <div style="background:#f7fafc; padding:16px; border-radius:6px; margin-top:24px; font-size:14px; color:#4a5568;">
                <strong style="color:#2d3748;">Need Help?</strong><br/>
                📧 <a href="mailto:support@yourcompany.com" style="color:#3182ce;">support@yourcompany.com</a><br/>
                📞 <a href="tel:+1555123456" style="color:#3182ce;">+1 (555) 123-4567</a><br/>
                💬 Live Chat: 9 AM - 6 PM EST
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#2d3748; padding:20px; font-size:13px; color:#a0aec0;">
              <p style="margin:0 0 6px;">Headspace Media, LLC</p>
              <p style="margin:0 0 6px;">Professional SEO & Content Marketing Services</p>
              <p style="margin:0 0 6px;">
                <a href="mailto:hello@headspacemedia.com" style="color:#63b3ed; text-decoration:none;">hello@headspacemedia.com</a> | 
                <a href="https://headspacemedia.com" style="color:#63b3ed; text-decoration:none;">headspacemedia.com</a>
              </p>
              <p style="margin-top:10px; font-size:12px; border-top:1px solid #4a5568; padding-top:10px;">
                &copy; ${new Date().getFullYear()} Headspace Media, LLC. All rights reserved.<br/>
                <a href="#unsubscribe" style="color:#63b3ed;">Unsubscribe</a> | 
                <a href="#privacy" style="color:#63b3ed;">Privacy Policy</a> | 
                <a href="#terms" style="color:#63b3ed;">Terms of Service</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
