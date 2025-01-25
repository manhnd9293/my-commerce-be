import { ConversationsEntity } from '../entities/conversations.entity';
import { ConversationAction } from '../enum/conversation-action';

export class UpdateConversationPayloadDto {
  data: ConversationsEntity;
  type: ConversationAction;
}
