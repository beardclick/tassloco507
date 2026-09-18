'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput({ className, ...rest }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className={`password-input ${className ?? ''}`}>
      <input type={show ? 'text' : 'password'} {...rest} />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        tabIndex={-1}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
