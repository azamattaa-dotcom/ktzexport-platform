import { redirect } from 'next/navigation';

export default function SupplierLoginRedirect({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const qs = searchParams.setup === 'success' ? '?setup=success' : '';
  redirect(`/${params.locale}/login${qs}`);
}
