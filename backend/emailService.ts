import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true para 465, false para outras portas
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendDashboardInvite(
    inviteEmail: string,
    inviterName: string,
    dashboardName: string,
    inviteToken: string,
    message?: string,
  ) {
    const inviteLink = `${process.env.FRONTEND_URL}/invite/${inviteToken}`;

    const htmlContent = this.generateInviteTemplate({
      inviteEmail,
      inviterName,
      dashboardName,
      inviteLink,
      message,
    });

    const mailOptions = {
      from: `"${process.env.APP_NAME || "Dashboard Financeiro"}" <${
        process.env.SMTP_USER
      }>`,
      to: inviteEmail,
      subject: `Convite para Dashboard: ${dashboardName}`,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email enviado:", result.messageId);
      return result;
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      throw error;
    }
  }

  private generateInviteTemplate({
    inviteEmail,
    inviterName,
    dashboardName,
    inviteLink,
    message,
  }: {
    inviteEmail: string;
    inviterName: string;
    dashboardName: string;
    inviteLink: string;
    message?: string;
  }) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite para Dashboard</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #10B981, #059669);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .invite-info {
            background-color: #f8fafc;
            border-left: 4px solid #10B981;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10B981, #059669);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
        }
        .cta-button:hover {
            background: linear-gradient(135deg, #059669, #047857);
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 20px 0;
        }
        .highlight {
            color: #10B981;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📊 Convite para Dashboard</h1>
        </div>
        
        <div class="content">
            <h2>Olá!</h2>
            
            <p><strong>${inviterName}</strong> convidou você para participar do dashboard financeiro <strong class="highlight">"${dashboardName}"</strong>.</p>
            
            ${
              message
                ? `
            <div class="invite-info">
                <strong>Mensagem do convite:</strong><br>
                "${message}"
            </div>
            `
                : ""
            }
            
            <p>Com este dashboard você poderá:</p>
            <ul>
                <li>📈 Acompanhar transações em tempo real</li>
                <li>💰 Gerenciar orçamentos compartilhados</li>
                <li>🎯 Definir e acompanhar metas financeiras</li>
                <li>📊 Visualizar relatórios e gráficos</li>
                <li>👥 Colaborar com outros membros</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" class="cta-button">
                    🚀 Aceitar Convite
                </a>
            </div>
            
            <div class="divider"></div>
            
            <p><small>Se você não tem uma conta, será criada automaticamente ao aceitar o convite.</small></p>
            
            <p><small>Este convite expira em 7 dias. Se você não conseguir clicar no botão, copie e cole este link no seu navegador:</small></p>
            <p><small style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">${inviteLink}</small></p>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado para <strong>${inviteEmail}</strong></p>
            <p>Dashboard Financeiro - Gerencie suas finanças de forma inteligente</p>
        </div>
    </div>
</body>
</html>`;
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("Conexão SMTP configurada corretamente");
      return true;
    } catch (error) {
      console.error("Erro na configuração SMTP:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
