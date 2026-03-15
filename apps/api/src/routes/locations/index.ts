import type { FastifyInstance } from 'fastify';

export async function locationRoutes(app: FastifyInstance) {
  // GET /api/v1/locations/divisions
  app.get('/divisions', async (_request, reply) => {
    const divisions = await app.prisma.division.findMany({
      orderBy: { nameEn: 'asc' },
    });
    return reply.send({ success: true, data: divisions });
  });

  // GET /api/v1/locations/districts?division_id=<uuid>
  app.get<{ Querystring: { division_id?: string } }>('/districts', async (request, reply) => {
    const { division_id } = request.query;
    const districts = await app.prisma.district.findMany({
      where: division_id ? { divisionId: division_id } : undefined,
      orderBy: { nameEn: 'asc' },
    });
    return reply.send({ success: true, data: districts });
  });

  // GET /api/v1/locations/upazilas?district_id=<uuid>
  app.get<{ Querystring: { district_id?: string } }>('/upazilas', async (request, reply) => {
    const { district_id } = request.query;
    const upazilas = await app.prisma.upazila.findMany({
      where: district_id ? { districtId: district_id } : undefined,
      orderBy: { nameEn: 'asc' },
    });
    return reply.send({ success: true, data: upazilas });
  });
}
