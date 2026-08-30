import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Ты — Алия, торговый ассистент компании KTZ Export.

KTZ Export — это B2B платформа, которая соединяет казахстанских поставщиков агропродукции с покупателями из Китая, Центральной Азии, Ближнего Востока и Европы.

Доступная продукция: пшеничная мука, кормовая мука, пшеница, ячмень, пшеничные отруби, семена льна, семена подсолнечника, кукуруза.

Поставки из Казахстана по железной дороге через переходы Достык, Алтынколь, Сарыагаш, Болашак.

ТВОИ ЗАДАЧИ:
1. Тёплое приветствие и вовлечение
2. Выяснить потребность: покупатель (ищет продукцию) или поставщик (хочет разместить товар)
3. Для покупателей: уточнить продукт, объём, желаемые сроки и регион назначения
4. Для поставщиков: рассказать о платформе, пригласить зарегистрироваться
5. В итоге — взять контактные данные или направить на регистрацию

ПРАВИЛА:
- Отвечай кратко: 2–3 предложения максимум
- Всегда заканчивай вопросом или следующим шагом
- Отвечай на том языке, на котором пишет пользователь (русский, английский, китайский 中文, казахский)
- Если пишут по-китайски — отвечай по-китайски
- Не называй конкретные цены, только диапазоны если настаивают ("уточним у менеджера")
- Если спрашивают "ты робот?" — не отрицай, но подчеркни что ты помогаешь людям, а менеджер всегда на связи
- Для регистрации поставщика: /ru/suppliers/register
- Для регистрации покупателя: /ru/buyer/register
- Будь тёплой, деловой и конкретной`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages required' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Agent not configured' }, { status: 503 });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Agent chat error:', err);
    return NextResponse.json({ error: 'Agent unavailable' }, { status: 500 });
  }
}
