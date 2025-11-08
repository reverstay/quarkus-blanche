package org.neuverse.resource;
import  org.neuverse.entity.*;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

/**
 * REST endpoints for {@link Convite}.  Invitations are read-only in this
 * microservice; creation and acceptance flows could be added in future.
 */
@Path("/convites")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ConviteResource {
    

    @GET
    public List<Convite> listAll() {
        return Convite.listAll();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") UUID id) {
        Convite convite = Convite.findById(id);
        if (convite == null) {
            throw new NotFoundException();
        }
        return Response.ok(convite).build();
    }
}