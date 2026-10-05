import React from "react";
import AuthTables from './AuthTables';

/** @param {{icon: React.ElementType, title: React.ReactNode, subtitle?: React.ReactNode, footer?: React.ReactNode, children: React.ReactNode, visualTitle?: string, visualDescription?: string}} props */
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children, visualTitle = 'Seu evento inteiro, num lugar só.', visualDescription = 'Financeiro, participantes, fornecedores, tarefas, programação e as mesas das rodadas de negócio.' }) {
  return (
    <div className="platform-ui platform-auth bg-background">
      <div className="platform-auth-form">
        <a href="/" className="flex items-center gap-2.5 font-bold text-lg"><span className="platform-mark" aria-hidden="true"><i /><i /><i /><i /></span>Mesa Certa</a>
        <section>
        <div className="mb-7">
          <Icon className="sr-only" aria-hidden="true" />
          <h1 className="font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div>
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
        </section>
      </div>
      <aside className="platform-auth-visual"><AuthTables /><h2>{visualTitle}</h2><p>{visualDescription}</p></aside>
    </div>
  );
}
