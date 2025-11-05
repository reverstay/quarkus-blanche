package org.neuverse.resource;
import  org.neuverse.entity.*;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

/**
 * REST endpoints for managing {@link Empresa} entities.  Only basic read
 * operations are implemented here; write operations could be added as needed.
 */
@Path("/empresas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EmpresaResource {

    /**
     * Returns all companies visible to the current authenticated user.  Row
     * level security in the database ensures that only permitted rows are
     * returned.
     */
    @GET
    public List<Empresa> listAll() {
        return Empresa.listAll();
    }

    /**
     * Retrieves a single company by its UUID.  If not found, a 404 status is returned.
     *
     * @param id the UUID of the company
     * @return the company or 404 if not found
     */
    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") UUID id) {
        Empresa empresa = Empresa.findById(id);
        if (empresa == null) {
            throw new NotFoundException();
        }
        return Response.ok(empresa).build();
    }
}