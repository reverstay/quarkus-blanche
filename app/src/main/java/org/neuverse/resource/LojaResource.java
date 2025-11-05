package org.neuverse.resource;
import  org.neuverse.entity.*;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

/**
 * REST endpoints for {@link Loja} entities.  Provides basic listing and
 * lookup by ID.  The underlying database enforces row level security so
 * users only see stores within their companies.
 */
@Path("/lojas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LojaResource {

    @GET
    public List<Loja> listAll() {
        return Loja.listAll();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") UUID id) {
        Loja loja = Loja.findById(id);
        if (loja == null) {
            throw new NotFoundException();
        }
        return Response.ok(loja).build();
    }
}