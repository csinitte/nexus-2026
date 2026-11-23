'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { useRegistrationClosed } from '@/components/register/use-registration-closed';
import { useRegistrationReceipt } from '@/components/register/registration-receipt';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { arrow?: ReactNode };

export function RegistrationLink({ children = 'Register now', arrow, ...props }: Props) {
  const receipt = useRegistrationReceipt();
  const closed = useRegistrationClosed();
  return (
    <Link href={receipt ? '/summary' : '/register'} {...props}>
      {receipt ? 'View registration' : closed ? 'Registration closed' : children}
      {arrow && <> <span aria-hidden="true">{arrow}</span></>}
    </Link>
  );
}
