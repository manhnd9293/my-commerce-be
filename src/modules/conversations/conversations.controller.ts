import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { User } from '../../decorators/user.decorator';
import { UserAuth } from '../auth/jwt.strategy';
import { UpdateConversationStatusDto } from './dto/update-conversation-status.dto';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../utils/enums/user-role';
import { QueryConversationDto } from './dto/query-conversation.dto';

@Controller('conversations')
@ApiTags('Conversations')
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @User() user: UserAuth,
  ) {
    return this.conversationService.createConversation(
      createConversationDto,
      user,
    );
  }

  @Get()
  @Roles([UserRole.Admin])
  getConversations(@Query() query: QueryConversationDto) {
    return this.conversationService.getConversations(query);
  }

  @Get('current')
  getCurrentConversation(@User() user: UserAuth) {
    return this.conversationService.getCurrentConversation(user);
  }

  @Get(':id')
  getConversationDetail(@Param('id') id: string, @User() user: UserAuth) {
    return this.conversationService.getConversationDetail(+id, user);
  }

  @Get(':id/messages')
  getConversationMessages(@Param('id') id: string) {
    return this.conversationService.getConversationMessages(id);
  }

  @Patch(':id/status')
  @Roles([UserRole.Admin])
  updateConversationStatus(
    @Param('id') id: string,
    @User() user: UserAuth,
    @Body() data: UpdateConversationStatusDto,
  ) {
    return this.conversationService.updateConversationStatus(id, data, user);
  }
}
