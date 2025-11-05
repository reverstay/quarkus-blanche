package org.neuverse.resource;
import  org.neuverse.entity.*;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

/**
 * REST endpoints exposing {@link Permissao} records.  Note that read access
 * is filtered by row level security policies defined in the database, so
 * callers will only see their own permissions or those permitted via an
 * ADMIN role.
 */
@Path("/permissoes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PermissaoResource {

    @GET
    public List<Permissao> listAll() {
        return Permissao.listAll();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") UUID id) {
        Permissao permissao = Permissao.findById(id);
        if (permissao == null) {
            throw new NotFoundException();
        }
        return Response.ok(permissao).build();
    }
}