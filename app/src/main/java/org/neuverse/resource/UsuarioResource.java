package org.neuverse.resource;
import  org.neuverse.entity.*;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.net.URI;
import java.util.List;
import java.util.UUID;

@Path("/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuarioResource {

    @GET
    public List<Usuario> listAll() {
        return Usuario.listAll();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") UUID id) {
        Usuario usuario = Usuario.findById(id);
        if (usuario == null) {
            throw new NotFoundException();
        }
        return Response.ok(usuario).build();
    }

    @POST
    @Transactional
    public Response create(Usuario incoming, @Context UriInfo uriInfo) {
        if (incoming == null) {
            throw new BadRequestException("Corpo da requisição ausente.");
        }
        if (incoming.email == null || incoming.email.isBlank()) {
            throw new BadRequestException("Campo 'email' é obrigatório.");
        }

        // Monta a entidade a ser persistida
        Usuario u = new Usuario();
        u.id = (incoming.id != null) ? incoming.id : UUID.randomUUID();
        u.nome = incoming.nome;
        u.email = incoming.email;
        u.onl = incoming.ativo;                // cuidado: é primitivo (boolean), default = false se não enviado
        u.cargo = incoming.cargo;
        u.cpf = incoming.cpf;
        u.dataAdmissao = incoming.dataAdmissao;
        u.criado_em = incoming.criado_em;        // opcional; se quiser confiar no default do banco, pode deixar null

        try {
            u.persist();             // Panache persist
            // garante geração de erro imediato se violar unique/email etc.
            Usuario.getEntityManager().flush();

            URI location = uriInfo.getAbsolutePathBuilder().path(u.id.toString()).build();
            return Response.created(location).entity(u).build();
        } catch (Exception e) {
            // Mapeia violação de unicidade do email para 409
            String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            if (msg.contains("unique") || msg.contains("duplicate") || msg.contains("usuarios_email")) {
                throw new WebApplicationException("Email já está em uso.", Response.Status.CONFLICT);
            }
            // outros erros (ex.: RLS bloqueando INSERT)
            throw new WebApplicationException("Falha ao inserir usuário: " + e.getMessage(),
                    Response.Status.INTERNAL_SERVER_ERROR);
        }
    }
}
