import { redirect } from 'next/navigation';

export default function BuyerLoginRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/login`);
}
