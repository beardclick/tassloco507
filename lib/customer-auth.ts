import 'server-only';
import { cookies } from 'next/headers';
import { getCustomerById, type Customer } from './db';
import { createSession, credentialVersion, readSession } from './sessions';

export const CUSTOMER_COOKIE = 'tassloco_customer';

export async function signCustomerToken(customer: Customer): Promise<string> {
  return createSession({ kind: 'customer', subject_id: String(customer.id), identity: customer.email.toLowerCase(), credential_version: credentialVersion(customer.passwordHash) });
}

export async function verifyCustomerToken(token: string | undefined | null): Promise<{ id: number; email: string } | null> {
  const session = await readSession(token, 'customer');
  if (!session) return null;
  const customer = await getCustomerById(Number(session.subject_id));
  return customer && customer.email.toLowerCase() === session.identity && credentialVersion(customer.passwordHash) === session.credential_version
    ? { id: customer.id, email: customer.email } : null;
}

export async function currentCustomer(): Promise<{ id: number; email: string } | null> {
  const store = await cookies();
  return verifyCustomerToken(store.get(CUSTOMER_COOKIE)?.value);
}
