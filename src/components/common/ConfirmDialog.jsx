import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';

/** Confirmação modal (AlertDialog) para ações que mudam acesso ou removem algo.
 * O pai fecha o modal quando a ação termina; enquanto `pending` ele não fecha. */
export default function ConfirmDialog({open,onOpenChange,title,description,confirmLabel,pendingLabel='Aguarde…',destructive=false,pending=false,error='',onConfirm}) {
  return <AlertDialog open={open} onOpenChange={value=>{if(!pending)onOpenChange(value);}}>
    <AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
        <AlertDialogAction disabled={pending} className={destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined} onClick={event=>{event.preventDefault();onConfirm();}}>{pending ? pendingLabel : confirmLabel}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
