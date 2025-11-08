package org.neuverse.resource;

import io.quarkus.hibernate.orm.panache.Panache;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import org.neuverse.entity.Usuario;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@Path("/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuarioResource {

    @GET
    public List<Usuario> listAll(@QueryParam("email") String email) {
        if (email != null && !email.isBlank()) {
            Usuario u = Usuario.findByEmail(email);
            return u == null ? List.of() : List.of(u);
        }
        return Usuario.list("order by criadoEm desc");
    }

    @GET @Path("/{id}")
    public Response getById(@PathParam("id") UUID id) {
        Usuario usuario = Usuario.findById(id);
        if (usuario == null) throw new NotFoundException();
        return Response.ok(usuario).build();
    }

    @POST
    @Transactional
    public Response create(Usuario incoming, @Context UriInfo uriInfo) {
        if (incoming == null) throw new BadRequestException("Corpo da requisição ausente.");
        if (incoming.email == null || incoming.email.isBlank())
            throw new BadRequestException("Campo 'email' é obrigatório.");

        if (Usuario.find("email", incoming.email).firstResult() != null)
            throw new WebApplicationException("Email já está em uso.", Response.Status.CONFLICT);

        Usuario u = new Usuario();
        u.id = incoming.id; // se null, @PrePersist gera
        u.nome = incoming.nome;
        u.email = incoming.email;
        u.online = incoming.online; // default false no @PrePersist
        u.cargo = incoming.cargo;
        u.senhaHash = incoming.senhaHash;
        u.lojaId = incoming.lojaId;

        u.persist();
        Panache.getEntityManager().flush();

        URI location = uriInfo.getAbsolutePathBuilder().path(u.id.toString()).build();
        return Response.created(location).entity(u).build();
    }

    @PUT @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") UUID id, Usuario incoming) {
        Usuario u = Usuario.findById(id);
        if (u == null) throw new NotFoundException();

        if (incoming.email == null || incoming.email.isBlank())
            throw new BadRequestException("Campo 'email' é obrigatório.");

        if (!incoming.email.equalsIgnoreCase(u.email)) {
            if (Usuario.find("email", incoming.email).firstResult() != null)
                throw new WebApplicationException("Email já está em uso.", Response.Status.CONFLICT);
        }

        u.nome = incoming.nome;
        u.email = incoming.email;
        if (incoming.online != null) u.online = incoming.online;
        u.cargo = incoming.cargo;
        u.senhaHash = incoming.senhaHash;
        u.lojaId = incoming.lojaId;

        Panache.getEntityManager().flush();
        return Response.ok(u).build();
    }

    @DELETE @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") UUID id) {
        boolean ok = Usuario.deleteById(id);
        if (!ok) throw new NotFoundException();
        return Response.noContent().build();
    }
}
