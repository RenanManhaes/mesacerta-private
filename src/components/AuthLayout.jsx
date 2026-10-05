import React from "react";

/** @param {{icon: React.ElementType, title: React.ReactNode, subtitle?: React.ReactNode, footer?: React.ReactNode, children: React.ReactNode}} props */
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="platform-ui platform-auth bg-background">
      <div className="platform-auth-form">
        <a href="/" className="flex items-center gap-2.5 font-bold text-lg"><span className="platform-mark" aria-hidden="true"><i /><i /><i /><i /></span>Mesa Certa</a>
        <section>
        <div className="mb-7">
          <Icon className="w-6 h-6 text-info mb-4" aria-hidden="true" />
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
      <aside className="platform-auth-visual"><h2>Seu evento inteiro, num lugar só.</h2><p>Financeiro, participantes, fornecedores, tarefas, programação e as mesas das rodadas de negócio.</p></aside>
    </div>
  );
}
