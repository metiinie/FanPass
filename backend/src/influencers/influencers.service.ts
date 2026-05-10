import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InfluencersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(search?: string) {
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { teamSupported: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.influencer.findMany({
      where,
      orderBy: [{ isVerified: 'desc' }, { totalTicketsSold: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        profilePhoto: true,
        bio: true,
        teamSupported: true,
        teamColor: true,
        isVerified: true,
        totalTicketsSold: true,
        _count: { select: { events: true } },
      },
    });
  }

  async getBySlug(slug: string) {
    const influencer = await this.prisma.influencer.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        profilePhoto: true,
        bio: true,
        teamSupported: true,
        teamColor: true,
        tiktokUrl: true,
        instagramUrl: true,
        telegramUrl: true,
        isVerified: true,
        totalTicketsSold: true,
        createdAt: true,
        events: {
          orderBy: { dateTime: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            dateTime: true,
            venue: true,
            city: true,
            ticketPrice: true,
            currency: true,
            maxCapacity: true,
            ticketsSold: true,
            status: true,
            homeTeam: true,
            awayTeam: true,
            competition: true,
            matchKickoff: true,
            coverImage: true,
          },
        },
      },
    });

    if (!influencer) throw new NotFoundException('Influencer not found');
    return influencer;
  }

  async getEventsBySlug(slug: string) {
    const influencer = await this.prisma.influencer.findUnique({ where: { slug } });
    if (!influencer) throw new NotFoundException('Influencer not found');

    return this.prisma.event.findMany({
      where: { organizerId: influencer.id },
      orderBy: { dateTime: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        dateTime: true,
        venue: true,
        city: true,
        ticketPrice: true,
        currency: true,
        maxCapacity: true,
        ticketsSold: true,
        status: true,
        homeTeam: true,
        awayTeam: true,
        competition: true,
        matchKickoff: true,
        coverImage: true,
      },
    });
  }

  async updateMyProfile(influencerId: string, data: {
    name?: string;
    bio?: string;
    profilePhoto?: string;
    teamSupported?: string;
    teamColor?: string;
    tiktokUrl?: string;
    instagramUrl?: string;
    telegramUrl?: string;
    slug?: string;
  }) {
    // If changing slug, ensure it's unique
    if (data.slug) {
      const existing = await this.prisma.influencer.findFirst({
        where: { slug: data.slug, id: { not: influencerId } },
      });
      if (existing) {
        throw new UnauthorizedException('This profile URL is already taken. Please choose another.');
      }
    }

    return this.prisma.influencer.update({
      where: { id: influencerId },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        profilePhoto: true,
        bio: true,
        teamSupported: true,
        teamColor: true,
        tiktokUrl: true,
        instagramUrl: true,
        telegramUrl: true,
        isVerified: true,
        totalTicketsSold: true,
      },
    });
  }

  async getMyProfile(influencerId: string) {
    const influencer = await this.prisma.influencer.findUnique({
      where: { id: influencerId },
      select: {
        id: true,
        name: true,
        slug: true,
        profilePhoto: true,
        bio: true,
        teamSupported: true,
        teamColor: true,
        tiktokUrl: true,
        instagramUrl: true,
        telegramUrl: true,
        isVerified: true,
        totalTicketsSold: true,
      },
    });
    if (!influencer) throw new NotFoundException('Profile not found');
    return influencer;
  }
}
