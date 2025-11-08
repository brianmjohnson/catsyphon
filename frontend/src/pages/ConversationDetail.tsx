/**
 * Conversation Detail page - Full conversation with messages.
 */

import { useParams } from 'react-router-dom';

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Conversation Detail</h1>
      <p className="text-muted-foreground">
        Conversation {id} details will be displayed here.
      </p>
    </div>
  );
}
