import {useId,type ButtonHTMLAttributes,type InputHTMLAttributes,type TextareaHTMLAttributes,type ReactNode} from 'react';
type ButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{busy?:boolean;variant?:'primary'|'secondary'|'ghost'|'danger';size?:'normal'|'small'};
export function Button({busy=false,variant='secondary',size='normal',className='',disabled,type='button',children,...props}:ButtonProps){
 return <button {...props} type={type} className={'ui-button '+className} data-variant={variant} data-size={size} disabled={disabled||busy} aria-busy={busy||undefined}>{busy&&<span className="ui-spinner" aria-hidden="true"/>}{children}</button>;
}
export function IconButton({label,className='',variant='ghost',...props}:ButtonProps&{label:string}){return <Button {...props} variant={variant} className={'ui-icon-button '+className} aria-label={label}/>;}
type FieldProps={label:string;hint?:string;error?:string};
function Field({id,label,hint,error,children}:FieldProps&{id:string;children:ReactNode}){return <div className="ui-field"><label htmlFor={id}>{label}</label>{children}{hint&&<p className="ui-field-hint" id={id+'-hint'}>{hint}</p>}{error&&<p className="ui-field-error" id={id+'-error'}>{error}</p>}</div>;}
function described(id:string,hint:string|undefined,error:string|undefined,other:string|undefined){return[other,hint?id+'-hint':null,error?id+'-error':null].filter(Boolean).join(' ')||undefined;}
export function TextField({label,hint,error,id:providedId,className='',...props}:InputHTMLAttributes<HTMLInputElement>&FieldProps){
 const generated=useId(),id=providedId??generated;
 return <Field id={id} label={label} hint={hint} error={error}><input {...props} id={id} className={'ui-input '+className} aria-invalid={!!error||props['aria-invalid']} aria-describedby={described(id,hint,error,props['aria-describedby'])}/></Field>;
}
export function TextAreaField({label,hint,error,id:providedId,className='',...props}:TextareaHTMLAttributes<HTMLTextAreaElement>&FieldProps){
 const generated=useId(),id=providedId??generated;
 return <Field id={id} label={label} hint={hint} error={error}><textarea {...props} id={id} className={'ui-input '+className} aria-invalid={!!error||props['aria-invalid']} aria-describedby={described(id,hint,error,props['aria-describedby'])}/></Field>;
}
export function Badge({tone='neutral',children,className=''}:{tone?:'neutral'|'accent'|'live'|'warning';children:ReactNode;className?:string}){return <span className={'ui-badge '+className} data-tone={tone}>{tone==='live'&&<span className="ui-live-dot" aria-hidden="true"/>}{children}</span>;}
export function InlineNotice({tone='info',announce=true,children,className=''}:{tone?:'error'|'info'|'success'|'warning';announce?:boolean;children:ReactNode;className?:string}){return <div className={'ui-notice '+className} data-tone={tone} role={announce?(tone==='error'?'alert':'status'):undefined}>{children}</div>;}
export function EmptyState({title,description,action,icon}:{title:string;description:string;action?:ReactNode;icon?:ReactNode}){return <div className="ui-empty">{icon&&<span className="ui-empty-icon" aria-hidden="true">{icon}</span>}<h3>{title}</h3><p>{description}</p>{action}</div>;}
