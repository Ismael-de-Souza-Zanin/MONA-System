using System.Text;
using System.Text.Json.Serialization;
using FattoVirtual.Infrastructure;
using FattoVirtual.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration);

var jwtKey = builder.Configuration["Jwt:Key"] ?? "FattoVirtual_Dev_Signing_Key_Change_In_Production_32+";
builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "FattoVirtual",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "FattoVirtual",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            NameClaimType = "sub"
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseAuthentication();
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated == true)
    {
        var path = context.Request.Path;
        var passwordRoute = path.Equals("/api/v1/auth/change-password", StringComparison.OrdinalIgnoreCase);
        var logoutRoute = path.Equals("/api/v1/auth/logout", StringComparison.OrdinalIgnoreCase);
        var meRoute = path.Equals("/api/v1/auth/me", StringComparison.OrdinalIgnoreCase);
        if (!passwordRoute && !logoutRoute && !meRoute)
        {
            var userId = context.User.FindFirst("sub")?.Value;
            if (userId is not null)
            {
                var db = context.RequestServices.GetRequiredService<AppDbContext>();
                var mustChangePassword = await db.Users.AsNoTracking()
                    .Where(user => user.Id == userId)
                    .Select(user => user.MustChangePassword)
                    .FirstOrDefaultAsync();
                if (mustChangePassword)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        detail = "Troque sua senha temporária para continuar.",
                        code = "PASSWORD_CHANGE_REQUIRED"
                    });
                    return;
                }
            }
        }
    }

    await next();
});
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<DbSeeder>();
    await seeder.SeedAsync();
}

app.Run();
