import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('me')
  me(
    @Headers('x-dev-telegram-id') devTelegramId: string,
    @Headers('x-telegram-init-data') telegramInitData: string,
  ) {
    return this.appService.me({ devTelegramId, telegramInitData });
  }

  @Get('wallet')
  wallet(
    @Headers('x-dev-telegram-id') devTelegramId: string,
    @Headers('x-telegram-init-data') telegramInitData: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.wallet({
      devTelegramId,
      telegramInitData,
      limit: Number(limit || 20),
    });
  }

  @Post('dev/plays/add')
  devAddPlays(
    @Headers('x-dev-telegram-id') devTelegramId: string,
    @Headers('x-telegram-init-data') telegramInitData: string,
    @Body() body: any,
  ) {
    return this.appService.devAddPlays({
      devTelegramId,
      telegramInitData,
      count: Number(body?.count || 10),
    });
  }

  @Post('play')
  play(
    @Headers('x-dev-telegram-id') devTelegramId: string,
    @Headers('x-telegram-init-data') telegramInitData: string,
    @Query('tgWebAppData') tgWebAppData: string,
    @Body() body: any,
  ) {
    return this.appService.play({
      devTelegramId,
      telegramInitData:
        telegramInitData || String(tgWebAppData || '') || String(body?.telegram_init_data || ''),
      multi: Number(body?.multi || 1),
    });
  }

  @Post('events')
  events(
    @Headers('x-dev-telegram-id') devTelegramId: string,
    @Headers('x-telegram-init-data') telegramInitData: string,
    @Body() body: any,
  ) {
    return this.appService.events({
      devTelegramId,
      telegramInitData,
      body,
    });
  }

  @Get('products')
  products() {
    return this.appService.products();
  }

  @Get('marketplace/products')
  marketplaceProducts(
    @Query('category') category?: string,
    @Query('lang') lang?: string,
  ) {
    return this.appService.marketplaceProducts({ category, lang });
  }

  @Get('marketplace/products/:id')
  marketplaceProduct(@Param('id') id: string, @Query('lang') lang?: string) {
    return this.appService.marketplaceProduct({ id, lang });
  }

  @Get('marketplace/services')
  marketplaceServices(
    @Query('city') city?: string,
    @Query('category') category?: string,
  ) {
    return this.appService.marketplaceServices({ city, category });
  }

  @Post('marketplace/orders')
  marketplaceCreateOrder(
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Body() body: any,
  ) {
    return this.appService.marketplaceCreateOrder(body || {}, {
      idempotency_key: String(idempotencyKey || ''),
    });
  }

  @Post('marketplace/checkout')
  marketplaceCheckout(
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Body() body: any,
  ) {
    return this.appService.marketplaceCheckout(body || {}, {
      idempotency_key: String(idempotencyKey || ''),
    });
  }

  @Post('v1/auth/telegram/login')
  v1AuthTelegramLogin(@Body() body: any) {
    return this.appService.v1AuthTelegramLogin(body || {});
  }

  @Post('v1/auth/telegram/webapp/login')
  v1AuthTelegramWebappLogin(@Body() body: any) {
    return this.appService.v1AuthTelegramWebappLogin(body || {});
  }

  @Post('v1/auth/telegram/webapp/bind-phone')
  v1AuthTelegramWebappBindPhone(@Body() body: any) {
    return this.appService.v1AuthTelegramWebappBindPhone(body || {});
  }

  @Get('v1/users/by-phone')
  v1UserByPhone(@Query('phone') phone: string) {
    return this.appService.v1UserByPhone(phone);
  }

  @Post('v1/users')
  v1CreateUser(@Body() body: any) {
    return this.appService.v1CreateUser(body || {});
  }

  @Get('v1/pets')
  v1Pets(@Query('phone') phone: string) {
    return this.appService.v1PetsList(phone);
  }

  @Post('v1/pets')
  v1CreatePet(@Body() body: any) {
    return this.appService.v1PetUpsert(body || {});
  }

  @Patch('v1/pets/:id')
  v1UpdatePet(@Param('id') id: string, @Body() body: any) {
    return this.appService.v1PetUpsert({ ...(body || {}), id });
  }

  @Delete('v1/pets/:id')
  v1DeletePet(@Param('id') id: string, @Query('phone') phone: string) {
    return this.appService.v1PetDelete({ id, phone });
  }

  @Get('v1/orders')
  v1Orders(@Query('phone') phone: string) {
    return this.appService.v1OrdersByPhone(phone);
  }

  @Get('v1/orders/:id')
  v1OrderDetail(@Param('id') id: string) {
    return this.appService.v1OrderDetail(id);
  }

  @Post('v1/orders/intake')
  v1OrdersIntake(@Body() body: any) {
    return this.appService.v1OrdersIntake(body || {});
  }

  @Get('v1/payments')
  v1Payments(@Query('phone') phone: string) {
    return this.appService.v1PaymentsByPhone(phone);
  }

  @Get('v1/payments/order/:id')
  v1PaymentsByOrder(@Param('id') id: string) {
    return this.appService.v1PaymentsByOrder(id);
  }

  @Get('v1/marketplace/categories')
  v1MarketplaceCategories() {
    return this.appService.v1MarketplaceCategories();
  }

  @Get('v1/marketplace/cemetery-layout')
  v1CemeteryLayout() {
    return this.appService.v1CemeteryLayout();
  }

  @Get('v1/geo/reverse')
  v1GeoReverse(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.appService.v1GeoReverse({ lat, lng });
  }

  @Get('v1/memorial-favorites')
  v1MemorialFavList(@Query('phone') phone: string) {
    return this.appService.v1MemorialFavoritesList(phone);
  }

  @Post('v1/memorial-favorites')
  v1MemorialFavAdd(@Body() body: any) {
    return this.appService.v1MemorialFavoritesAdd(body || {});
  }

  @Delete('v1/memorial-favorites/:id')
  v1MemorialFavDelete(@Param('id') id: string, @Query('phone') phone: string) {
    return this.appService.v1MemorialFavoritesDelete({ memorialId: id, phone });
  }

  @Get('v1/merchant/me')
  v1MerchantMe(@Req() req: any) {
    return this.appService.v1MerchantMe(req);
  }

  @Get('v1/merchant/orders')
  v1MerchantOrders(@Req() req: any) {
    return this.appService.v1MerchantOrders(req);
  }

  @Get('v1/merchant/orders/:id')
  v1MerchantOrderDetail(@Req() req: any, @Param('id') id: string) {
    return this.appService.v1MerchantOrderDetail(req, id);
  }

  @Get('v1/merchant/products')
  v1MerchantProducts(@Req() req: any) {
    return this.appService.v1MerchantProducts(req);
  }

  @Post('v1/merchant/products')
  v1MerchantCreateProduct(@Req() req: any, @Body() body: any) {
    return this.appService.v1MerchantCreateProduct(req, body || {});
  }

  @Patch('v1/merchant/products/:id')
  v1MerchantUpdateProduct(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.appService.v1MerchantUpdateProduct(req, {
      id,
      body: body || {},
    });
  }

  @Post('v1/merchant/products/:id/status')
  v1MerchantProductStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.appService.v1MerchantSetStatus(req, {
      id,
      status: body?.status,
    });
  }

  @Post('v1/merchant/products/:id/stock')
  v1MerchantProductStock(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.appService.v1MerchantSetStock(req, { id, stock: body?.stock });
  }

  @Post('v1/merchant/products/:id/images')
  v1MerchantAddImage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.appService.v1MerchantAddImage(req, {
      id,
      image_url: body?.image_url,
    });
  }

  @Patch('v1/merchant/products/:id/images/sort')
  v1MerchantSortImages(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.appService.v1MerchantSortImages(req, {
      id,
      image_ids: body?.image_ids,
    });
  }

  @Delete('v1/merchant/products/:id/images/:imageId')
  v1MerchantDeleteImage(
    @Req() req: any,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.appService.v1MerchantDeleteImage(req, { id, imageId });
  }

  @Get('v1/merchant/revenue')
  v1MerchantRevenue(@Req() req: any) {
    return this.appService.v1MerchantRevenue(req);
  }

  @Get('v1/merchant/notifications')
  v1MerchantNotifications(@Req() req: any) {
    return this.appService.v1MerchantNotifications(req);
  }

  @Get('v1/merchant/products/:id/review-history')
  v1MerchantReviewHistory(@Req() req: any) {
    return this.appService.v1MerchantReviewHistory(req);
  }

  @Get('v1/merchant/settlement-requests')
  v1MerchantSettlementRequests(@Req() req: any) {
    return this.appService.v1MerchantSettlementRequests(req);
  }

  @Post('v1/merchant/settlement-requests')
  v1MerchantCreateSettlementRequest(@Req() req: any, @Body() body: any) {
    return this.appService.v1MerchantCreateSettlementRequest(req, body || {});
  }

  @Post('v1/merchant/orders/:id/accept')
  v1MerchantOrderAccept(@Req() req: any) {
    return this.appService.v1MerchantOrderAction(req);
  }

  @Post('v1/merchant/orders/:id/reject')
  v1MerchantOrderReject(@Req() req: any) {
    return this.appService.v1MerchantOrderAction(req);
  }

  @Post('v1/merchant/orders/:id/ship')
  v1MerchantOrderShip(@Req() req: any) {
    return this.appService.v1MerchantOrderAction(req);
  }

  @Get('cart')
  cart(@Query('phone') phone?: string) {
    return this.appService.cart({ phone: String(phone || '') });
  }

  @Post('cart/items')
  cartAddItem(@Body() body: any) {
    return this.appService.cartAddItem(body || {});
  }

  @Patch('cart/items/:id')
  cartPatchItem(@Param('id') id: string, @Body() body: any) {
    return this.appService.cartPatchItem({ id, ...(body || {}) });
  }

  @Delete('cart/items/:id')
  cartDeleteItem(@Param('id') id: string, @Query('phone') phone?: string) {
    return this.appService.cartDeleteItem({ id, phone: String(phone || '') });
  }

  @Get('orders')
  orders(@Query('limit') limit?: string) {
    return this.appService.orders({ limit: Number(limit || 30) });
  }

  @Get('groups/active')
  groupsActive() {
    return this.appService.groupsActive();
  }

  @Get('groups/discover')
  groupsDiscover() {
    return this.appService.groupsDiscover();
  }

  @Post('payments/plays')
  createPlaysPayment(
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Body() body: any,
  ) {
    return this.appService.createPlaysPayment({
      bundle: Number(body?.bundle || 1),
      idempotency_key: String(idempotencyKey || ''),
    });
  }

  @Get('payments/:id')
  payment(@Param('id') id: string) {
    return this.appService.payment({ id });
  }

  @Post('payments/:id/proof')
  submitProof(@Param('id') id: string, @Body() body: any) {
    return this.appService.submitProof({
      id,
      proof_text: String(body?.proof_text || ''),
    });
  }

  @Post('payments/:id/proof_file')
  submitProofFile(@Param('id') id: string, @Body() body: any) {
    return this.appService.submitProofFile({
      id,
      mime_type: String(body?.mime_type || 'application/octet-stream'),
      file_base64: String(body?.file_base64 || ''),
    });
  }

  @Get('payments/:id/proof_file')
  paymentProofFile(@Param('id') id: string, @Res() res: Response) {
    const file = this.appService.getProofFile(id);
    if (!file) {
      res.status(404).send('');
      return;
    }

    const buf = Buffer.from(file.file_base64 || '', 'base64');
    res.setHeader('content-type', file.mime_type || 'application/octet-stream');
    res.status(200).send(buf);
  }

  @Post('shipping')
  saveShipping(
    @Headers('x-dev-telegram-id') devTelegramId: string,
    @Headers('x-telegram-init-data') telegramInitData: string,
    @Body() body: any,
  ) {
    return this.appService.saveShipping({
      devTelegramId,
      telegramInitData,
      name: String(body?.name || ''),
      phone: String(body?.phone || ''),
      address: String(body?.address || ''),
    });
  }

  @Post('purchase/direct')
  purchaseDirect(
    @Headers('x-dev-telegram-id') devTelegramId: string,
    @Headers('x-telegram-init-data') telegramInitData: string,
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Body() body: any,
  ) {
    return this.appService.purchaseDirect({
      devTelegramId,
      telegramInitData,
      idempotency_key: String(idempotencyKey || ''),
      product_id: Number(body?.product_id),
    });
  }

  @Post('purchase/group')
  purchaseGroup(
    @Headers('x-dev-telegram-id') devTelegramId: string,
    @Headers('x-telegram-init-data') telegramInitData: string,
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Body() body: any,
  ) {
    return this.appService.purchaseGroup({
      devTelegramId,
      telegramInitData,
      idempotency_key: String(idempotencyKey || ''),
      product_id: Number(body?.product_id),
    });
  }

  @Post('groups')
  createGroup(@Body() body: any) {
    return this.appService.createGroup({
      product_id: Number(body?.product_id),
    });
  }

  @Post('groups/:groupId/join')
  joinGroup(@Param('groupId') groupId: string) {
    return this.appService.joinGroup({ groupId });
  }

  @Post('groups/:groupId/join_pay')
  joinGroupPay(
    @Param('groupId') groupId: string,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    return this.appService.joinGroupPay({
      groupId,
      idempotency_key: String(idempotencyKey || ''),
    });
  }

  @Get('admin/dashboard/summary')
  adminDashboardSummary() {
    return this.appService.adminDashboardSummary();
  }

  @Get('admin/settings/business')
  adminGetBusinessSettings() {
    return this.appService.adminGetBusinessSettings();
  }

  @Put('admin/settings/business')
  adminUpdateBusinessSettings(@Body() body: any) {
    return this.appService.adminUpdateBusinessSettings(body || {});
  }

  @Get('admin/users')
  adminUsers(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('petType') petType?: string,
    @Query('spendLevel') spendLevel?: string,
    @Query('status') status?: string,
  ) {
    return this.appService.adminUsers({
      current,
      pageSize,
      keyword,
      petType,
      spendLevel,
      status,
    });
  }

  @Post('admin/users/:globalUserId/freeze')
  adminFreezeUser(@Param('globalUserId') globalUserId: string) {
    return this.appService.adminFreezeUser({ globalUserId });
  }

  @Post('admin/users/:globalUserId/unfreeze')
  adminUnfreezeUser(@Param('globalUserId') globalUserId: string) {
    return this.appService.adminUnfreezeUser({ globalUserId });
  }

  @Get('admin/users/:globalUserId')
  adminUserDetail(@Param('globalUserId') globalUserId: string) {
    return this.appService.adminUserDetail({ globalUserId });
  }

  @Get('admin/withdrawRequests')
  adminWithdrawRequests(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('globalUserId') globalUserId?: string,
  ) {
    return this.appService.adminWithdrawRequests({
      current,
      pageSize,
      status,
      globalUserId,
    });
  }

  @Post('admin/withdraw-requests/:id/approve')
  adminApproveWithdraw(@Param('id') id: string) {
    return this.appService.adminWithdrawDecision({ id, action: 'approve' });
  }

  @Post('admin/withdraw-requests/:id/reject')
  adminRejectWithdraw(@Param('id') id: string) {
    return this.appService.adminWithdrawDecision({ id, action: 'reject' });
  }

  @Get('admin/merchants')
  adminMerchants(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    return this.appService.adminMerchants({ current, pageSize, status });
  }

  @Post('admin/merchants/:id/approve')
  adminMerchantApprove(@Param('id') id: string) {
    return this.appService.adminMerchantDecision({ id, action: 'approve' });
  }

  @Post('admin/merchants/:id/reject')
  adminMerchantReject(@Param('id') id: string) {
    return this.appService.adminMerchantDecision({ id, action: 'reject' });
  }

  @Post('admin/merchants/:id/suspend')
  adminMerchantSuspend(@Param('id') id: string) {
    return this.appService.adminMerchantDecision({ id, action: 'suspend' });
  }

  @Get('admin/products')
  adminProducts(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.appService.adminProducts({ current, pageSize });
  }

  @Put('admin/products/:id')
  adminUpdateProduct(@Param('id') id: string, @Body() body: any) {
    return this.appService.adminUpdateProduct({ id, ...(body || {}) });
  }

  @Post('admin/products/:id/publish')
  adminPublishProduct(@Param('id') id: string) {
    return this.appService.adminSetProductStatus({ id, status: 'published' });
  }

  @Post('admin/products/:id/unpublish')
  adminUnpublishProduct(@Param('id') id: string) {
    return this.appService.adminSetProductStatus({ id, status: 'unpublished' });
  }

  @Get('admin/services')
  adminServices(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.appService.adminServices({ current, pageSize });
  }

  @Get('admin/orders')
  adminOrders(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('phone') phone?: string,
  ) {
    return this.appService.adminOrders({ current, pageSize, phone });
  }

  @Get('admin/campaigns')
  adminCampaigns(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.appService.adminCampaigns({
      current,
      pageSize,
      status,
      type,
      keyword,
    });
  }

  @Post('admin/campaigns')
  adminCampaignCreate(@Req() req: any, @Body() body: any) {
    return this.appService.adminCampaignCreate(req, body || {});
  }

  @Get('admin/campaigns/:id')
  adminCampaignDetail(@Param('id') id: string) {
    return this.appService.adminCampaignDetail({ id });
  }

  @Put('admin/campaigns/:id')
  adminCampaignUpdate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.appService.adminCampaignUpdate(req, { id, body: body || {} });
  }

  @Delete('admin/campaigns/:id')
  adminCampaignDelete(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminCampaignDelete(req, { id });
  }

  @Post('admin/campaigns/:id/publish')
  adminCampaignPublish(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminCampaignPublish(req, { id });
  }

  @Post('admin/campaigns/:id/deactivate')
  adminCampaignDeactivate(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminCampaignDeactivate(req, { id });
  }

  @Get('admin/groups')
  adminGroups(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.appService.adminGroups({ current, pageSize, status, keyword });
  }

  @Post('admin/groups')
  adminGroupCreate(@Req() req: any, @Body() body: any) {
    return this.appService.adminGroupCreate(req, body || {});
  }

  @Get('admin/groups/:id')
  adminGroupDetail(@Param('id') id: string) {
    return this.appService.adminGroupDetail({ id });
  }

  @Put('admin/groups/:id')
  adminGroupUpdate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.appService.adminGroupUpdate(req, { id, body: body || {} });
  }

  @Delete('admin/groups/:id')
  adminGroupDelete(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminGroupDelete(req, { id });
  }

  @Post('admin/groups/:id/activate')
  adminGroupActivate(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminGroupActivate(req, { id });
  }

  @Post('admin/groups/:id/deactivate')
  adminGroupDeactivate(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminGroupDeactivate(req, { id });
  }

  @Get('admin/referrals')
  adminReferrals(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.appService.adminReferrals({
      current,
      pageSize,
      status,
      keyword,
    });
  }

  @Post('admin/referrals')
  adminReferralCreate(@Req() req: any, @Body() body: any) {
    return this.appService.adminReferralCreate(req, body || {});
  }

  @Get('admin/referrals/:id')
  adminReferralDetail(@Param('id') id: string) {
    return this.appService.adminReferralDetail({ id });
  }

  @Put('admin/referrals/:id')
  adminReferralUpdate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.appService.adminReferralUpdate(req, { id, body: body || {} });
  }

  @Delete('admin/referrals/:id')
  adminReferralDelete(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminReferralDelete(req, { id });
  }

  @Post('admin/referrals/:id/activate')
  adminReferralActivate(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminReferralActivate(req, { id });
  }

  @Post('admin/referrals/:id/deactivate')
  adminReferralDeactivate(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminReferralDeactivate(req, { id });
  }

  @Get('admin/referrals/distributors')
  adminDistributors(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('subjectType') subjectType?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.appService.adminDistributors({
      current,
      pageSize,
      status,
      subjectType,
      keyword,
    });
  }

  @Post('admin/referrals/distributors')
  adminDistributorUpsert(@Req() req: any, @Body() body: any) {
    return this.appService.adminDistributorUpsert(req, body || {});
  }

  @Get('admin/rewards')
  adminRewards(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('subjectType') subjectType?: string,
    @Query('keyword') keyword?: string,
    @Query('ruleId') ruleId?: string,
  ) {
    return this.appService.adminRewards({
      current,
      pageSize,
      status,
      subjectType,
      keyword,
      ruleId,
    });
  }

  @Post('admin/rewards')
  adminRewardCreate(@Req() req: any, @Body() body: any) {
    return this.appService.adminRewardCreate(req, body || {});
  }

  @Post('admin/rewards/:id/revoke')
  adminRewardRevoke(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminRewardRevoke(req, { id });
  }

  @Get('admin/rewards/rules')
  adminRewardRules(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.appService.adminRewardRules({
      current,
      pageSize,
      status,
      keyword,
    });
  }

  @Post('admin/rewards/rules')
  adminRewardRuleCreate(@Req() req: any, @Body() body: any) {
    return this.appService.adminRewardRuleCreate(req, body || {});
  }

  @Put('admin/rewards/rules/:id')
  adminRewardRuleUpdate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.appService.adminRewardRuleUpdate(req, { id, body: body || {} });
  }

  @Post('admin/rewards/rules/:id/activate')
  adminRewardRuleActivate(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminRewardRuleActivate(req, {
      id,
      status: 'active',
    });
  }

  @Post('admin/rewards/rules/:id/deactivate')
  adminRewardRuleDeactivate(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminRewardRuleActivate(req, {
      id,
      status: 'inactive',
    });
  }

  @Get('admin/riskBlacklist')
  adminRiskBlacklist(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('subjectType') subjectType?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.appService.adminRiskBlacklist({
      current,
      pageSize,
      status,
      subjectType,
      keyword,
    });
  }

  @Post('admin/riskBlacklist')
  adminRiskBlacklistCreate(@Req() req: any, @Body() body: any) {
    return this.appService.adminRiskBlacklistCreate(req, body || {});
  }

  @Put('admin/riskBlacklist/:id')
  adminRiskBlacklistUpdate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.appService.adminRiskBlacklistUpdate(req, {
      id,
      body: body || {},
    });
  }

  @Delete('admin/riskBlacklist/:id')
  adminRiskBlacklistDelete(@Req() req: any, @Param('id') id: string) {
    return this.appService.adminRiskBlacklistDelete(req, { id });
  }

  @Post('admin/riskBlacklist/check')
  adminRiskBlacklistCheck(@Body() body: any) {
    return this.appService.adminRiskBlacklistCheck(body || {});
  }

  @Get('admin/audit')
  adminAudit(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('success') success?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.appService.adminAudit({
      current,
      pageSize,
      module,
      action,
      success,
      keyword,
    });
  }

  @Get('admin/bridge/reports/summary')
  adminBridgeSummary() {
    return this.appService.adminBridgeSummary();
  }

  @Get('admin/bridge/events')
  adminBridgeEvents(
    @Query('since') since?: string,
    @Query('event_name') eventName?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.adminBridgeEvents({ since, eventName, limit });
  }

  @Get('admin/crm/leads')
  adminCrmLeads(
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('stage') stage?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.adminCrmLeads({ country, city, stage, q, limit });
  }

  @Get('admin/crm/leads/:leadId/events')
  adminCrmLeadEvents(
    @Param('leadId') leadId: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.adminCrmLeadEvents({ leadId, limit });
  }

  @Patch('admin/crm/leads/:leadId')
  adminCrmUpdateLead(@Param('leadId') leadId: string, @Body() body: any) {
    return this.appService.adminCrmUpdateLead({ leadId, ...(body || {}) });
  }

  @Post('admin/crm/leads/:leadId/events')
  adminCrmAppendLeadEvent(@Param('leadId') leadId: string, @Body() body: any) {
    return this.appService.adminCrmAppendLeadEvent({ leadId, ...(body || {}) });
  }

  @Get('admin/crm/followups')
  adminCrmFollowups(
    @Query('due_before') dueBefore?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.adminCrmFollowups({ dueBefore, status, limit });
  }

  @Post('admin/crm/followups')
  adminCrmCreateFollowup(@Body() body: any) {
    return this.appService.adminCrmCreateFollowup(body || {});
  }

  @Post('admin/crm/followups/auto-generate')
  adminCrmAutoGenerateFollowups(@Body() body: any) {
    return this.appService.adminCrmAutoGenerateFollowups(body || {});
  }

  @Post('admin/crm/followups/:id/result')
  adminCrmFollowupResult(@Param('id') id: string, @Body() body: any) {
    return this.appService.adminCrmFollowupResult({ id, ...(body || {}) });
  }

  @Post('admin/crm/followups/:id/execute')
  adminCrmExecuteFollowup(@Param('id') id: string, @Body() body: any) {
    return this.appService.adminCrmExecuteFollowup({ id, ...(body || {}) });
  }

  @Post('admin/outreach/telegram/send')
  adminOutreachTelegramSend(@Body() body: any) {
    return this.appService.adminOutreachTelegramSend(body || {});
  }

  @Post('admin/ai/support/reply')
  adminAiSupportReply(@Body() body: any) {
    return this.appService.adminAiSupportReply(body || {});
  }

  @Post('admin/pricing/aftercare/pricebooks')
  adminUpsertAftercarePricebook(@Body() body: any) {
    return this.appService.adminUpsertAftercarePricebook(body || {});
  }

  @Get('admin/pricing/aftercare/pricebooks')
  adminListAftercarePricebooks(
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.adminListAftercarePricebooks({ country, city, limit });
  }

  @Post('admin/pricing/aftercare/quotes')
  adminCreateAftercareQuote(@Body() body: any) {
    return this.appService.adminCreateAftercareQuote(body || {});
  }

  @Get('admin/pricing/aftercare/quotes')
  adminListAftercareQuotes(
    @Query('lead_id') leadId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.adminListAftercareQuotes({ leadId, status, limit });
  }

  @Get('admin/pricing/aftercare/quotes/:id')
  adminGetAftercareQuote(@Param('id') id: string) {
    return this.appService.adminGetAftercareQuote({ id });
  }

  @Patch('admin/pricing/aftercare/quotes/:id')
  adminUpdateAftercareQuote(@Param('id') id: string, @Body() body: any) {
    return this.appService.adminUpdateAftercareQuote({ id, ...(body || {}) });
  }

  @Post('admin/pricing/aftercare/quotes/:id/send')
  adminSendAftercareQuote(@Param('id') id: string, @Body() body: any) {
    return this.appService.adminSendAftercareQuote({ id, ...(body || {}) });
  }

  @Post('admin/pricing/aftercare/quotes/:id/void')
  adminVoidAftercareQuote(@Param('id') id: string, @Body() body: any) {
    return this.appService.adminVoidAftercareQuote({ id, ...(body || {}) });
  }

  @Post('v1/aftercare/quote')
  v1AftercareQuote(@Body() body: any) {
    return this.appService.v1AftercareQuote(body || {});
  }

  @Get('v1/aftercare/quotes/by_token/:token')
  v1AftercareQuoteByToken(@Param('token') token: string) {
    return this.appService.v1AftercareQuoteByToken({ token });
  }

  @Post('v1/aftercare/quotes/by_token/:token/decision')
  v1AftercareQuoteDecisionByToken(@Param('token') token: string, @Body() body: any) {
    return this.appService.v1AftercareQuoteDecisionByToken({ token, ...(body || {}) });
  }

  @Get('admin/clawPools')
  adminClawPools(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.appService.adminClawPools({ current, pageSize });
  }

  @Post('admin/clawPools')
  adminCreateClawPool(@Body() body: any) {
    return this.appService.adminCreateClawPool(body || {});
  }

  @Put('admin/clawPools/:id')
  adminUpdateClawPool(@Param('id') id: string, @Body() body: any) {
    return this.appService.adminUpdateClawPool({ id, ...(body || {}) });
  }

  @Delete('admin/clawPools/:id')
  adminDeleteClawPool(@Param('id') id: string) {
    return this.appService.adminDeleteClawPool({ id });
  }

  @Post('admin/clawPools/:id/publish')
  adminPublishClawPool(@Param('id') id: string) {
    return this.appService.adminPublishClawPool({ id });
  }

  @Get('admin/clawPlays')
  adminClawPlays(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.appService.adminClawPlays({ current, pageSize });
  }

  @Get('admin/risk/summary')
  adminRiskSummary() {
    return this.appService.adminRiskSummary();
  }

  @Get('admin/risk/alerts')
  adminRiskAlerts(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.appService.adminRiskAlerts({ current, pageSize });
  }

  @Get('admin/ai/ops/daily')
  adminAiOpsDaily() {
    return this.appService.adminAiOpsDaily();
  }

  @Post('admin/ai/ops/daily')
  adminAiOpsGenerateDaily(@Body() body: any) {
    return this.appService.adminAiOpsGenerateDaily(body || {});
  }

  @Post('admin/ai/ops/publish')
  adminAiOpsPublish(@Body() body: any) {
    return this.appService.adminAiOpsPublish(body || {});
  }

  @Post('admin/ai/ops/smoke')
  adminAiOpsSmoke(@Body() body: any) {
    return this.appService.adminAiOpsSmoke(body || {});
  }

  @Post('admin/ai/growth/generate')
  adminAiGrowthGenerate(@Body() body: any) {
    return this.appService.adminAiGrowthGenerate(body || {});
  }

  @Get('admin/ai/growth/contents')
  adminAiGrowthContents(
    @Query('status') status?: string,
    @Query('country') country?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.adminAiGrowthContents({ status, country, limit });
  }

  @Patch('admin/ai/growth/contents/:id')
  adminAiGrowthUpdate(@Param('id') id: string, @Body() body: any) {
    return this.appService.adminAiGrowthUpdate({ id, ...(body || {}) });
  }

  @Get('admin/ai/templates')
  adminAiTemplates(
    @Query('scene') scene?: string,
    @Query('enabled') enabled?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.adminAiTemplates({ scene, enabled, limit });
  }

  @Post('admin/ai/templates')
  adminAiCreateTemplate(@Body() body: any) {
    return this.appService.adminAiCreateTemplate(body || {});
  }

  @Patch('admin/ai/templates/:id')
  adminAiUpdateTemplate(@Param('id') id: string, @Body() body: any) {
    return this.appService.adminAiUpdateTemplate({ id, ...(body || {}) });
  }

  @Post('admin/ai/risk/summarize')
  adminAiRiskSummarize(@Body() body: any) {
    return this.appService.adminAiRiskSummarize(body || {});
  }

  @Get('admin/wallet/overview')
  adminWalletOverview() {
    return this.appService.adminWalletOverview();
  }

  @Get('admin/wallet/logs')
  adminWalletLogs(
    @Query('current') current?: string,
    @Query('pageSize') pageSize?: string,
    @Query('globalUserId') globalUserId?: string,
    @Query('bizType') bizType?: string,
    @Query('assetType') assetType?: string,
    @Query('refId') refId?: string,
  ) {
    return this.appService.adminWalletLogs({
      current,
      pageSize,
      globalUserId,
      bizType,
      assetType,
      refId,
    });
  }

  @Get('admin/console/orders')
  adminConsoleOrders(
    @Query('user_id') user_id?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.appService.adminConsoleOrders({
      user_id,
      type,
      status,
      from,
      to,
      page,
      pageSize,
    });
  }

  @Get('admin/console/orders/:orderId')
  adminConsoleOrder(@Param('orderId') orderId: string) {
    return this.appService.adminConsoleOrder({ orderId });
  }

  @Get('admin/reports/daily')
  adminReportDaily(@Query('date') date?: string) {
    return this.appService.adminReportDaily({ date });
  }

  @Get('admin/reports/profit')
  adminReportProfit(@Query('days') days?: string) {
    return this.appService.adminReportProfit({ days });
  }
}
